import easy_nodes
easy_nodes.initialize_easy_nodes(default_category="OmegaLambda", auto_register=False)

# Simply importing your module gives the ComfyNode decorator a chance to register your nodes.
from .py.combo_params import *  # noqa: F403, E402

NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS = easy_nodes.get_node_mappings()
NODE_CLASS_MAPPINGS["ParamList"] = ParamList
NODE_DISPLAY_NAME_MAPPINGS["ParamList"] = ParamList.NAME
WEB_DIRECTORY = "./js"
__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
