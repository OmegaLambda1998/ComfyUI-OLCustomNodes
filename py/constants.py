NAMESPACE: str ='OL'

def get_name(name: str) -> str:
    return f"({NAMESPACE}) {name}"

def get_category(category: str = "") -> str:
    if category != "":
        return f"{NAMESPACE}/{category}"
    return NAMESPACE
