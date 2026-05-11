from dataclasses import dataclass

from PIL import Image


@dataclass
class InpaintingResult:
    image: Image.Image
