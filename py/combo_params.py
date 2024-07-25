from easy_nodes import (
    ComfyNode,
    AnyType,
    StringInput,
    TypeVerifier 
)
import easy_nodes

from .constants import get_category, get_name

from typing import Any, Iterable, Iterator

CATEGORY: str = get_category("Combinatorics")

#
# --- Utilities ---
#

def flatten(xs: Any) -> Iterator:
    if isinstance(xs, Iterable):
        for x in xs:
            yield from flatten(x)
    else:
        yield xs

class ContainsAnyDict(dict):
    def __contains__(self, key):
        return True

#
# --- Custom Types ---
#

class ComboParam:
    ctype: type
    cname: str
    cvalue: AnyType

    def __repr__(self):
        return f"{self.cname}\n  {self.ctype}: {self.cvalue}"

    def __str__(self):
        return self.__repr__()
easy_nodes.register_type(ComboParam, "CPARAM")

class ComboParamSet:
    ctypes: list[type]
    cnames: list[str]
    cvalues: list[AnyType]
    cset: list[ComboParam]

    def __repr__(self):
        return f"ctypes: {self.ctypes}\ncnames: {self.cnames}\ncvalues: {cvalues}"

    def __str__(self):
        return self.__repr__()

    def params_from_set(self):
        if len(self.cset) > 0:
            self.ctypes, self.cnames, self.cvalues = list(zip(*[
                (cparam.ctype, cparam.cname, cparam.cvalue) for cparam in self.cset
            ]))

    def set_from_params(self):
        self.cset = []
        for (ctype, cname, cvalue) in zip(self.ctypes, self.cnames, self.cvalues):
            cparam = ComboParam()
            cparam.ctype = ctype
            cparam.cname = cname
            cparam.cvalue = cvalue
            self.cset.append(cparam)
easy_nodes.register_type(ComboParamSet, "CPARAMSET")

#
# --- Custom Nodes ---
#

class ParamList:
    
    NAME = get_name("Param List")
    CATEGORY = CATEGORY

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {},
            "optional": ContainsAnyDict()
        }

    RETURN_TYPES = (AnyType("*"),)
    RETURN_NAMES = ("*",)
    OUTPUT_IS_LIST = (True,)
    FUNCTION = "param_list"

    def param_list(self, **kwargs):
        rtn = []
        for (key, value) in kwargs.items():
            print(key, value)
            if key.startswith("param_") and value is not None:
                rtn.append(value)
        print(rtn)
        return [[rtn]]

@ComfyNode(display_name=get_name("Combo Param"),
           category=CATEGORY,
           return_names=["CPARAM"],
           debug=True)
def combo_param(value: AnyType,
                opt_name: str = StringInput(""),
                ) -> ComboParam:
    cparam = ComboParam()
    cparam.ctype = str(type(value).__qualname__)
    if opt_name == "":
        opt_name = cparam.ctype
    cparam.cname = opt_name
    cparam.cvalue = value
    return cparam

@ComfyNode(display_name=get_name("Extract Param"),
           category=CATEGORY,
           return_names=["*"],
           debug=True)
def extract_param(cparam: ComboParam) -> AnyType:
    return cparam.cvalue

@ComfyNode(display_name=get_name("Combo Param Set from List"),
           category=CATEGORY,
           return_names=["CPARAMSET"],
           debug=True)
def combo_param_set_from_list(cparams: list[ComboParam],
                              opt_set_name: str = StringInput(""),
                             ) -> ComboParamSet:
    cparamset = ComboParamSet()
    cparamset.cset = list(flatten(cparams))
    cparamset.params_from_set()
    return cparamset

@ComfyNode(display_name=get_name("Combo Param Set from Params"),
           category=CATEGORY,
           return_names=["CPARAMSET"],
           debug=True)
def combo_param_set_from_params(values: list[AnyType],
                                opt_names: list[str] = [],
                                opt_set_name: str = StringInput(""),
                               ) -> ComboParamSet:
    ctype = type(values[0])
    for value in values:
        assert isinstance(value, ctype), f"Value: {value} has type {type(value)}, expecting {ctype}"
    if len(opt_names) == 0:
        cnames = [ctype] * len(values)
    elif len(opt_names) == 1:
        cnames = [opt_names[0]] * len(values)
    else:
        assert len(opt_names) == len(values), f"Lengths of values ({len(values)}) and opt_names ({len(opt_names)}) do not match"
        cnames = opt_names
    ctypes = [ctype] * len(values)
    cvalues = values

    cparamset = ComboParamSet()
    cparamset.ctypes = ctypes
    cparamset.cnames = cnames
    cparamset.cvalues = cvalues
    cparamset.set_from_params()
    return cparamset
