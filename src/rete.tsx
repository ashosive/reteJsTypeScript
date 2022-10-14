import React, { useState, useEffect, useCallback, useRef } from "react";
import Rete from "rete";
import { createRoot } from "react-dom/client";
// @ts-ignore
import ReactRenderPlugin from "rete-react-render-plugin";
import ConnectionPlugin from "rete-connection-plugin";
// @ts-ignore
import AreaPlugin from 'rete-area-plugin';
import Context from "efficy-rete-context-menu-plugin";
import { MyNode } from "./MyNode";

let numSocket = new Rete.Socket("Number value");

class NumControl extends Rete.Control {
    // @ts-ignore
    static component = ({ value, onChange }) => (
        <input
            type="number"
            value={value}
            ref={(ref) => {
                ref && ref.addEventListener("pointerdown", (e) => e.stopPropagation());
            }}
            onChange={(e) => onChange(+e.target.value)}
        />
    );
    private props: any;
    private emitter: any;
    private component: ({value, onChange}: { value: any; onChange: any }) => JSX.Element;

    constructor(emitter: any, key: string, node: { addControl?: any; data?: { [p: string]: any } }, readonly = false) {
        super(key);
        this.emitter = emitter;
        this.key = key;
        this.component = NumControl.component;

        // @ts-ignore
        const initial = node.data[key] || 0;

        // @ts-ignore
        node.data[key] = initial;
        this.props = {
            readonly,
            value: initial,
            onChange: (v: unknown) => {
                this.setValue(v);
                this.emitter.trigger("process");
            }
        };
    }

    setValue(val: unknown) {
        this.props.value = val;
        this.putData(this.key, val);
        this.update();
    }

    private update() {

    }
}

class NumComponent extends Rete.Component {
    constructor() {
        super("Number");
    }

    builder(node: { addControl?: any; data?: { [x: string]: any; }; }) {
        let out1 = new Rete.Output("num", "Number", numSocket);
        let ctrl = new NumControl(this.editor, "num", node);

        return node.addControl(ctrl).addOutput(out1);
    }

    // @ts-ignore
    worker(node: { data: { num: any; }; }, inputs: any, outputs: { [x: string]: any; }) {
        outputs["num"] = node.data.num;
    }
}

class AddComponent extends Rete.Component {
    constructor() {
        super("Add");
        // @ts-ignore
        this.data.component = MyNode; // optional
    }

    builder(node: { addInput?: any; data?: { [x: string]: any; }; }) {
        var inp1 = new Rete.Input("num1", "Number", numSocket);
        var inp2 = new Rete.Input("num2", "Number2", numSocket);
        var out = new Rete.Output("num", "Number", numSocket);

        inp1.addControl(new NumControl(this.editor, "num1", node));
        inp2.addControl(new NumControl(this.editor, "num2", node));

        return node
            .addInput(inp1)
            .addInput(inp2)
            .addControl(new NumControl(this.editor, "preview", node, true))
            .addOutput(out);
    }

    // @ts-ignore
    worker(node: { data: { num1: any; num2: any; }; id: number; }, inputs: { [x: string]: any[]; }, outputs: { [x: string]: any; }) {
        let n1 = inputs["num1"].length ? inputs["num1"][0] : node.data.num1;
        let n2 = inputs["num2"].length ? inputs["num2"][0] : node.data.num2;
        let sum = n1 + n2;

        // @ts-ignore
        this.editor.nodes
            .find((n) => n.id == node.id)
            .controls.get("preview")
            // @ts-ignore
            .setValue(sum);
        outputs["num"] = sum;
    }
}

export async function createEditor(container: HTMLElement) {
    let components = [new NumComponent(), new AddComponent()];

    let editor = new Rete.NodeEditor("demo@0.1.0", container);
    editor.use(ConnectionPlugin);
    editor.use(ReactRenderPlugin, { createRoot });
    editor.use(Context);

    let engine = new Rete.Engine("demo@0.1.0");

    components.map((c) => {
        // @ts-ignore
        editor.register(c);
        // @ts-ignore
        engine.register(c);
    });

    let n1 = await components[0].createNode({ num: 2 });
    let n2 = await components[0].createNode({ num: 3 });
    let add = await components[1].createNode();

    n1.position = [80, 200];
    n2.position = [80, 400];
    add.position = [500, 240];

    editor.addNode(n1);
    editor.addNode(n2);
    editor.addNode(add);

    // @ts-ignore
    editor.connect(n1.outputs.get("num"), add.inputs.get("num1"));
    // @ts-ignore
    editor.connect(n2.outputs.get("num"), add.inputs.get("num2"));

    editor.on(
        // @ts-ignore
        "process nodecreated noderemoved connectioncreated connectionremoved",
        async () => {
            console.log("process");
            await engine.abort();
            await engine.process(editor.toJSON());
        }
    );

    editor.view.resize();
    editor.trigger("process");
    AreaPlugin.zoomAt(editor, editor.nodes);

    return editor;
}

export function useRete() {
    const [container, setContainer] = useState(null);
    const editorRef = useRef();

    useEffect(() => {
        if (container) {
            createEditor(container).then((value) => {
                console.log("created");
                // @ts-ignore
                editorRef.current = value;
            });
        }
    }, [container]);

    useEffect(() => {
        return () => {
            if (editorRef.current) {
                console.log("destroy");
                // @ts-ignore
                editorRef.current.destroy();
            }
        };
    }, []);

    return [setContainer];
}