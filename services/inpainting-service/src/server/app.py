import io
import logging as log
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, StreamingResponse
from PIL import Image

from config.service.settings import settings
from src.inference.engine import InpaintingEngine

log.basicConfig(
    level=getattr(log, settings.log_level, log.INFO),
    format="%(asctime)s - %(levelname)s - %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage the application lifecycle.
    Load the AI model before receiving requests.
    """
    log.info(f"🔄 Starting service: {settings.service_name}...")

    # 1. initialize inpainter
    try:
        inpainter = InpaintingEngine()

        # 2. inject inpainter
        app.state.inpainter = inpainter
        log.info("✅ Inference engine ready and injected into app.state.")
    except Exception as e:
        log.critical(f"🔥 Critical failure when starting the inference engine: {e}")
        raise e

    yield

    # 3. shutdown
    log.info("🛑 Stopping service...")
    if hasattr(app.state, "inpainter"):
        del app.state.inpainter
        log.info("🗑️ Resources released.")


app = FastAPI(
    title="Image Inpainting Service",
    description="Microservice for image inpainting using Stable Diffusion",
    version="0.1.0",
    lifespan=lifespan,
)

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", include_in_schema=False)
async def root():
    """Redirect to the automatic documentation."""
    return RedirectResponse(url="/docs")


@app.post("/inpainting", tags=["Inference"])
async def inpaint_image(
    request: Request,
    file: UploadFile = File(..., description="Original image"),
    mask: UploadFile = File(..., description="Binary mask of the area to inpaint"),
    prompt: str = Form(default=settings.default_prompt),
):
    """Receive an original image and a mask, return the inpainted image as PNG."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="File must be an image.")
    if not mask.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Mask must be an image.")

    image_bytes = await file.read()
    mask_bytes = await mask.read()

    image_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    mask_pil = Image.open(io.BytesIO(mask_bytes)).convert("RGB")

    result = request.app.state.inpainter.predict(image_pil, mask_pil, prompt)

    buf = io.BytesIO()
    result.image.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")


@app.get("/health", tags=["Monitoring"])
async def health_check():
    """
    Endpoint for GCP/K8s Health Checks.
    Verify that the model is loaded into memory.
    """
    is_ready = hasattr(app.state, "inpainter") and app.state.inpainter._pipe is not None

    status = "ok" if is_ready else "not_ready"
    return {
        "status": status,
        "service": settings.service_name,
        "model": settings.model_path,
        "device": settings.device,
    }
