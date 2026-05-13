from __future__ import annotations

import logging
import time

import torch
from config.service.settings import settings
from diffusers import FluxFillPipeline
from huggingface_hub import login
from PIL import Image

from src.models import InpaintingResult

logger = logging.getLogger(__name__)


class InpaintingEngine:
    def __init__(self) -> None:
        logger.info("Initializing InpaintingEngine")

        if settings.hf_token:
            logger.info("Logging in to Hugging Face Hub")
            login(token=settings.hf_token)
        else:
            logger.warning(
                "HF_TOKEN not set — download of gated models (e.g. FLUX.1-Fill-dev) will fail"
            )

        logger.info("Loading model: %s", settings.model_path)

        device = settings.device if torch.cuda.is_available() else "cpu"
        if device != settings.device:
            logger.warning(
                "CUDA not available, falling back to CPU (requested: %s)",
                settings.device,
            )

        logger.info("Device: %s | dtype: bfloat16", device)

        t0 = time.perf_counter()
        self._pipe = FluxFillPipeline.from_pretrained(
            settings.model_path,
            torch_dtype=torch.bfloat16,
        ).to(device)

        self._pipe.enable_xformers_memory_efficient_attention()

        logger.info("Pipeline ready in %.2fs", time.perf_counter() - t0)

        self._device = device

    def predict(
        self, image: Image.Image, mask: Image.Image, prompt: str
    ) -> InpaintingResult:
        original_size = image.size

        size = (settings.img_width, settings.img_height)
        image_resized = image.resize(size)
        mask_resized = mask.resize(size)

        output = self._pipe(
            prompt=prompt,
            image=image_resized,
            mask_image=mask_resized,
            height=settings.img_height,
            width=settings.img_width,
            guidance_scale=settings.guidance_scale,
            num_inference_steps=settings.num_inference_steps,
            max_sequence_length=settings.max_sequence_length,
            generator=torch.Generator("cpu").manual_seed(0),
        ).images[0]

        final = output.resize(original_size)
        return InpaintingResult(image=final)
