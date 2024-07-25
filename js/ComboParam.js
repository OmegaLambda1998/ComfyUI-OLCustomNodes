import { app } from "../../scripts/app.js"

app.registerExtension({
    name: 'OL.ComboParam',
    async beforeRegisterNodeDef(nodeType, nodeData, app) {

        if (nodeData.name !== "ComboParam") {
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

                    if (fromNode) {
                        // make sure there is a parent for the link
                        const parent_link = fromNode.outputs[inp_link.origin_slot];
                        if (parent_link) {
                            this.ctype = parent_link.type;
                        }
                    }
                }
            }

            this.outputs[0].name = `CPARAM [${this.ctype}]`;
            if (this.outputs[0].links && this.outputs[0].links.length > 0) {
                //this.inputs[0].type = `${this.ctype}`;
            } else {
                this.inputs[0].type = "*";
            }
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

            if (this.outputs[0].links && this.outputs[0].links.length > 0) {
                if (this.ctype != "*" && this.ctype != type) {
                    //return false;
                }
            }
            this.ctype = type
            return r;
        }
        
        const onConnectionsChange = nodeType.prototype.onConnectionsChange;
        nodeType.prototype.onConnectionsChange = function (side, slot, connect, link_info, output) {
            const r = onConnectionsChange?.apply(this, arguments);

            this.ol_update();

            const out_link_ids = this.outputs[0].links;
            if (out_link_ids) {
                for (const out_link_id of out_link_ids) {
                    const out_link = this.graph.links[out_link_id];
                    if (out_link) {
                        const toNode = this.graph._nodes.find(
                            (otherNode) => otherNode.id == out_link.target_id
                        )

                        if (toNode) {
                            if ('ol_update' in toNode) {
                                toNode.ol_update();
                            }
                        }
                    }
                }
            }
            return r;
        }

        return nodeType;
    },
})
