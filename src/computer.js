import React from "react";
import {Accordion,AccordionTab} from 'primereact/accordion';
import {Button} from "primereact/button";
import {Column} from 'primereact/column';
import {DataTable} from 'primereact/datatable';
import {Growl} from 'primereact/growl';
import {Message} from 'primereact/message';
import {Toolbar} from "primereact/toolbar";

import {CH} from "./ch"

export class Computer extends CH {
    constructor(props) {
        super(props);
    }

    componentWillMount = () => {
        this.setState({
            showMemory: false
        });
    }

    showAlert(type=null, message=null, detail=null) {
        this.growl.show({severity: type, summary: message, detail: detail});
    }

    render() {
        const {
            memory, instructions, programs, showMemory, currentInstructionIndex
        } = this.state;

        return (
            <div>
                <Toolbar>
                    <div className="p-toolbar-group-left">
                        <Button label="New" icon="fa fa-plus" style={{marginRight:".25em"}}
                            onClick={() => this.clearMemory()}/>
                        <Button label="Upload" icon="fa fa-upload" className="p-button-success" />
                        <i className="fa fa-bars p-toolbar-separator" style={{marginRight:".25em"}} />
                        <Button label="Compilar" icon="fa fa-check" className="p-button-warning" style={{marginRight:".25em"}}
                            onClick={() => this.compile()}/>
                    </div>
                    <div className="p-toolbar-group-right">
                        <Button icon="fa fa-step-forward" style={{marginRight:".25em"}}
                            onClick={() => this.runNext()}/>
                        <Button icon="fa fa-play" className="p-button-success" style={{marginRight:".25em"}}
                            onClick={() => this.run()}/>
                    </div>
                </Toolbar>
                <div className="p-grid">
                    {instructions.length > 0 &&
                        <div className="p-col-12 p-md-5 p-lg-3">
                            <DataTable scrollable={true} scrollHeight="200px"
                                value={instructions.map((item, i) => {
                                return {
                                    index: i,
                                    value: item.value
                                }
                            })} header="Instrucciones">
                                <Column field="index" header="#" />
                                <Column field="value" header="Código" />
                            </DataTable>
                            <DataTable scrollable={true} scrollHeight="200px"
                                    value={memory.filter(x => x.type === "var").map((variable, i) => {
                                return {
                                    programName: programs[variable.programIndex].name,
                                    name: variable.name,
                                    value: JSON.stringify(variable.value)
                                }
                            })} header="Variables">
                                <Column field="programName" header="Programa" />
                                <Column field="name" header="Nombre" />
                                <Column field="value" header="Valor" />
                            </DataTable>
                        </div>
                    }
                    <div className="p-col">
                        {instructions.length > 0 && instructions[currentInstructionIndex] && <pre>{instructions[currentInstructionIndex].value}</pre>}
                    </div>
                    <div className="p-col-12 p-md-4 p-lg-3">
                        <Message severity="info" text={"Acumulador: " + (memory.length > 0 ? memory[0].value : 0)}></Message>
                        <Accordion activeIndex={showMemory ? 0 : null} onTabChange={(e) => this.setState({showMemory: e.index == 0})}>
                            <AccordionTab header={(!showMemory ? "Mostrar" : "Ocultar") + " memoria"}>
                                <DataTable scrollable={true} scrollHeight="200px"
                                        value={memory.map((item, i) => {
                                    return {
                                        index: i,
                                        value: item.value === null ? "--" : JSON.stringify(item.value)
                                    }
                                })} header="Memoria">
                                    <Column field="index" header="Posición" />
                                    <Column field="value" header="Valor" />
                                </DataTable>
                            </AccordionTab>
                        </Accordion>
                    </div>
                </div>
                <Growl ref={(el) => this.growl = el} />
            </div>
        );
    }
}
