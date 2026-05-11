import base64
import io
import logging as log
from contextlib import asynccontextmanager

import numpy as np
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from PIL import Image

from config.service.settings import settings
from src.inference.engine import SegmentationEngine
from src.models import SegmentationResponse

log.basicConfig(
    level=getattr(log, settings.log_level, log.INFO),
    format="%(asctime)s - %(levelname)s - %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage the application lifecycle.
    Load the AI ​​model before receiving requests.
    """
    log.info(f"🔄 Starting service: {settings.service_name}...")

    # 1. initialize segmenter
    try:
        segmenter = SegmentationEngine()

        # 2. inject segmenter
        app.state.segmenter = segmenter
        log.info("✅ Inference engine ready and injected into app.state.")
    except Exception as e:
        log.critical(f"🔥 Critical failure when starting the inference engine: {e}")
        raise e

    yield

    # 3. shutdown
    log.info("🛑 Stopping service...")
    if hasattr(app.state, "segmenter"):
        del app.state.segmenter
        log.info("🗑️ Resources released.")


app = FastAPI(
    title="Image Segmentation Service",
    description="Microservice for object segmentation",
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


@app.post("/segmenter", response_model=SegmentationResponse, tags=["Inference"])
async def segment_image(request: Request, file: UploadFile = File(...)):
    """Receive an image and return the segmentation masks with their labels and scores."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="File must be an image.")

    contents = await file.read()
    image_pil = Image.open(io.BytesIO(contents)).convert("RGB")
    image_bgr = np.array(image_pil)[:, :, ::-1]

    result = request.app.state.segmenter.predict(image_bgr)

    masks_b64 = []
    for mask in result.masks:
        buf = io.BytesIO()
        mask.save(buf, format="PNG")
        masks_b64.append(base64.b64encode(buf.getvalue()).decode("utf-8"))

    polygons = [poly.tolist() for poly in result.polygons]

    return SegmentationResponse(
        num_objects=result.num_objects,
        labels=result.labels,
        scores=result.scores,
        class_names=result.class_names,
        masks=masks_b64,
        polygons=polygons,
    )


@app.get("/health", tags=["Monitoring"])
async def health_check():
    """
    Endpoint for GCP/K8s Health Checks.
    Verify that the model is loaded into memory.
    """
    is_ready = (
        hasattr(app.state, "segmenter") and app.state.segmenter._predictor is not None
    )

    status = "ok" if is_ready else "not_ready"
    return {
        "status": status,
        "service": settings.service_name,
        "model": settings.model_weights,
        "device": settings.device,
    }
