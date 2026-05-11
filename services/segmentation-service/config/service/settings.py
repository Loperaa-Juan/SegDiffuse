from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    segmentation_model_config: str = (
        "COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml"
    )
    model_weights: str = "COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml"

    # Core
    service_name: str = "segementation_service"
    host: str = "0.0.0.0"
    port: int = 8080
    log_level: str = "INFO"

    # Inference
    device: str = "cuda:0"
    img_size: int = 640
    confidence_threshold: float = 0.55


settings = Settings()
