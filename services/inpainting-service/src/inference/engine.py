from __future__ import annotations

import logging
import time

import torch
from config.service.settings import settings
from diffusers import StableDiffusionInpaintPipeline
from PIL import Image

from src.models import InpaintingResult

logger = logging.getLogger(__name__)


class InpaintingEngine:
    def __init__(self) -> None:
        logger.info("Initializing InpaintingEngine")
        logger.info("Loading model: %s", settings.model_path)

        device = settings.device if torch.cuda.is_available() else "cpu"
        if device != settings.device:
            logger.warning(
                "CUDA not available, falling back to CPU (requested: %s)",
                settings.device,
            )

        logger.info("Device: %s | dtype: %s", device, torch.float16)

        t0 = time.perf_counter()
        self._pipe = StableDiffusionInpaintPipeline.from_pretrained(
            settings.model_path,
            torch_dtype=torch.float16,
            safety_checker=None,
            requires_safety_checker=False,
        ).to(device)

        logger.info("Pipeline ready in %.2fs", time.perf_counter() - t0)

        self._device = device

    def predict(
        self, image: Image.Image, mask: Image.Image, prompt: str
    ) -> InpaintingResult:
        """Run stable-diffusion inpainting on a RGB image with a RGB mask."""
        original_size = image.size

        generator = torch.Generator(device=self._device).manual_seed(0)

        size = (settings.img_size, settings.img_size)
        image_resized = image.resize(size)
        mask_resized = mask.resize(size)

        output = self._pipe(
            prompt=prompt,
            image=image_resized,
            mask_image=mask_resized,
            guidance_scale=settings.guidance_scale,
            num_inference_steps=settings.num_inference_steps,
            generator=generator,
            num_images_per_prompt=1,
        ).images[0]

        final = output.resize(original_size)
        return InpaintingResult(image=final)
