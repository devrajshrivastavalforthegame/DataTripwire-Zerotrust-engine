from dataclasses import dataclass
@dataclass(frozen=True)
class Decision:
    risk_score:int
    risk_level:str
    action:str
    explanation:str
def decide(anomaly_score:float,sensitivity:str,signals:list[str],verify:int,restrict:int,block:int)->Decision:
    score=min(100,max(0,round(anomaly_score*100))+{"Public":0,"Internal":0,"Confidential":5,"Restricted":10}.get(sensitivity,0))
    action="BLOCK" if score>=block else "RESTRICT" if score>=restrict else "VERIFY" if score>=verify else "ALLOW"
    level="CRITICAL" if score>=block else "HIGH" if score>=restrict else "MEDIUM" if score>=verify else "LOW"
    explanation=f"{level} risk driven by {', '.join(signals)}. Resource sensitivity: {sensitivity}." if signals else f"{level} risk. Activity is consistent with the evaluated baseline for this request."
    return Decision(score,level,action,explanation)
