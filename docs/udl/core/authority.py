def can(role_cfg: dict, capability: str) -> bool:
    return bool(role_cfg.get(capability, False))
