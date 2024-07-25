import { app } from "../../scripts/app.js"

app.registerExtension({
    name: 'OL.ParamList',
    async beforeRegisterNodeDef(nodeType, nodeData, app) {

        if (nodeData.name !== "ParamList") {
            return
        }

        nodeType.prototype.ctype = "*";
        nodeType.prototype.ol_update = function () {
            this.ctype = "*";

            if (!this.inputs || this.inputs.length == 0) {
                this.addInput("param_0", this.ctype);
            }

            // get ctype
            for (const idx in this.inputs) {
                let input = this.inputs[idx];
                
                // See if input has a link
                const link_id = input.link;
                if (link_id) {
                    const link = this.graph.links[link_id];
                    if (link) {
                        const fromNode = this.graph._nodes.find(
                            (otherNode) => otherNode.id == link.origin_id
                        )
                        if (fromNode) {
                            const parent_link = fromNode.outputs[link.origin_slot];
                            if (parent_link) {
                                if (this.ctype == "*") {
                                    this.ctype = parent_link.type
                                } else if (this.ctype != parent_link.type) {
                                    this.disconnectInput(idx);
                                }
                            }
                        }
                    }
                }
            }

            // Remove trailing empty inputs

            let is_trailing = true;
            while (is_trailing) {
                const idx = this.inputs.length - 1;
                if (idx == 0) {
                    is_trailing = false;
                } else {
                    let input = this.inputs[idx];
                    if (!input.link) {
                        this.removeInput(idx);
                    } else {
                        is_trailing = false;
                    }
                }
            }

            // See if we need more inputs
            if (this.inputs.length == this.inputs.filter(x => x.link).length) {
                this.addInput(`param_${this.inputs.length}`, this.ctype);
            }
            
            // Set all inputs to ctype
            for (let input of this.inputs) {
                input.type = this.ctype;
            }
            
            this.outputs[0].name = `${this.ctype} List`;
            this.outputs[0].type = this.ctype;

            console.log(this);
        }

        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = async function () {
            const r = onNodeCreated?.apply(this);
            this.ol_update();
            return r;
        }

        const onConnectionsChange = nodeType.prototype.onConnectionsChange;
        nodeType.prototype.onConnectionsChange = function (side, slot, connect, link_info, output) {
            const r = onConnectionsChange?.apply(this, arguments);

            this.ol_update();

            return r;
        }

        return nodeType;
    },
})
