import { app } from "../../scripts/app.js"

app.registerExtension({
    name: 'OL.ExtractParam',
    async beforeRegisterNodeDef(nodeType, nodeData, app) {

        if (nodeData.name !== "ExtractParam") {
            return
        }

        nodeType.prototype.ctype = "*";
        nodeType.prototype.ol_update = function () {
            this.ctype = "*";
            const inp_link_id = this.inputs[0].link;
            if (inp_link_id) {
                const inp_link = this.graph.links[inp_link_id];
                if (inp_link) {
                    const fromNode = this.graph._nodes.find(
                        (otherNode) => otherNode.id == inp_link.origin_id
                    )

                    if (fromNode && fromNode.ctype) {
                        this.ctype = fromNode.ctype;
                    }
                }
            }
            const out_link_ids = this.outputs[0].links;
            if (out_link_ids) {
                for (const out_link_id of out_link_ids) {
                    const out_link = this.graph.links[out_link_id];
                    if (out_link) {
                        const toNode = this.graph._nodes.find(
                            (otherNode) => otherNode.id == out_link.target_id
                        )
                        if (toNode) {
                            const child_link = toNode.inputs[out_link.target_slot];
                            if (child_link) {
                                if (this.ctype != "*" && child_link.type != "*" && this.ctype != child_link.type) {
                                    this.disconnectOutput(0);
                                } else {
                                    if (child_link.type != "*") {
                                        this.ctype = child_link.type;
                                    }
                                }
                            }
                        }
                    }
                }
            }
 
            this.outputs[0].name = `${this.ctype}`;
            this.outputs[0].type = `${this.ctype}`;
        }

        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = async function () {
            const r = onNodeCreated?.apply(this);
            this.ol_update();
            return r;
        }

        const onConnectInput = nodeType.prototype.onConnectInput;
        nodeType.prototype.onConnectInput = function (targetSlot, type, output, originNode, originSlot) {
            const r = onConnectInput?.apply(this, arguments);

            if (originNode.ctype) {
                if (this.outputs[0].links && this.outputs[0].links.length > 0) {
                    if (this.ctype != "*" && originNode.ctype != "*" && this.ctype != originNode.ctype) {
                        return false;
                    }
                }
                this.ctype = originNode.ctype
                return r;
            }
        }
        
        const onConnectionsChange = nodeType.prototype.onConnectionsChange;
        nodeType.prototype.onConnectionsChange = function (side, slot, connect, link_info, output) {
            const r = onConnectionsChange?.apply(this, arguments);

            this.ol_update();

            const inp_link_id = this.inputs[0].link;
            if (inp_link_id) {
                const inp_link = this.graph.links[inp_link_id];
                if (inp_link) {
                    const fromNode = this.graph._nodes.find(
                        (otherNode) => otherNode.id == inp_link.origin_id
                    )

                    if (fromNode) {
                        if ('ol_update' in fromNode) {
                            fromNode.ol_update();
                        }
                    }
                }
            }

            return r;
        }

        return nodeType;
    },
})
