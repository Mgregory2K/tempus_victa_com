from dataclasses import dataclass
from enum import Enum

class TerminalDecision(str, Enum):
    ACT = "ACT"
    REFUSE = "REFUSE"
    ESCALATE = "ESCALATE"
    DEFER = "DEFER"

@dataclass
class Decision:
    decision: TerminalDecision
    reason: str
    trace_id: str | None = None

def decide(action: str, role: str, governance: dict, limits: dict) -> Decision:
    # v2 baseline: minimal enforcement; extend later
    if governance.get("locality", {}).get("remote_calls") is False and action.startswith("remote:"):
        return Decision(TerminalDecision.REFUSE, "Remote calls are gated off by governance.")
    return Decision(TerminalDecision.ACT, "Allowed by current governance baseline.")
