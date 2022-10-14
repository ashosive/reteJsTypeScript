import React from "react";
// @ts-ignore
import { Node, Socket, Control } from "rete-react-render-plugin";

export class MyNode extends Node {
    private props: any;
    private state: any;
    render() {
        const { node, bindSocket, bindControl } = this.props;
        const { outputs, controls, inputs, selected } = this.state;

        return (
            <div className={`node ${selected}`} style={{ background: "grey" }}>
                <div className="title">
                    {"<<"} {node.name} {">>"}
                </div>
                {/* Outputs */}
                {outputs.map((output: { key: React.Key | null | undefined; name: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | React.ReactFragment | React.ReactPortal | null | undefined; socket: any; }) => (
                    <div className="output" key={output.key}>
                        <div className="output-title">{output.name}</div>
                        <Socket
                            type="output"
                            socket={output.socket}
                            io={output}
                            innerRef={bindSocket}
                        />
                    </div>
                ))}
                {/* Controls */}
                {controls.map((control: { key: React.Key | null | undefined; }) => (
                    <Control
                        className="control"
                        key={control.key}
                        control={control}
                        innerRef={bindControl}
                    />
                ))}
                {/* Inputs */}
                {inputs.map((input: { key: React.Key | null | undefined; socket: any; showControl: () => any; name: string | number | boolean | React.ReactFragment | React.ReactPortal | React.ReactElement<any, string | React.JSXElementConstructor<any>> | null | undefined; control: any; }) => (
                    <div className="input" key={input.key}>
                        <Socket
                            type="input"
                            socket={input.socket}
                            io={input}
                            innerRef={bindSocket}
                        />
                        {!input.showControl() && (
                            <div className="input-title">{input.name}</div>
                        )}
                        {input.showControl() && (
                            <Control
                                className="input-control"
                                control={input.control}
                                innerRef={bindControl}
                            />
                        )}
                    </div>
                ))}
            </div>
        );
    }
}
