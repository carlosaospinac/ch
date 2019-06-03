import React from "react";
import {Accordion,AccordionTab} from "primereact/accordion";
import {Button} from "primereact/button";
import {Column} from "primereact/column";
import {DataTable} from "primereact/datatable";
import {Dialog} from "primereact/dialog";
import {InputText} from "primereact/inputtext";
import {Growl} from "primereact/growl";
import {Messages} from "primereact/messages";
import {Panel} from "primereact/panel";
import {ScrollPanel} from "primereact/scrollpanel";
import {Slider} from 'primereact/slider';
import {Toolbar} from "primereact/toolbar";

import {CH} from "./ch"
import {Screen} from "./screen";

export class Computer extends CH {

    showAlert = (type=null, message=null, detail=null) => {
        this.growl.show({severity: type, summary: message, detail: detail});
    }

    show = (type, summary, detail) => {
        this.messages.show({
            closable: false,
            severity: type,
            summary: summary,
            detail: detail,
            sticky: true
        });
    }

    render() {
        const { errors, memory, memoryLength, instructions, programs, printer, speed } = this.state;
        const variables = memory.filter(x => x.type === "var");

        return (
            <div>
                <div className="p-grid">
                    {memory.length > 0 &&
                        <div className="p-col-12 p-md-4">
                            <Toolbar>
                                <div className="p-md-12 p-lg-6 p-toolbar-group-left">
                                    <Button label="Nuevo" icon="fa fa-plus" style={{marginRight:".25em"}}
                                        onClick={() => this.clearMemory(true)}/>
                                    <Button label="Cargar" icon="fa fa-upload" className="p-button-success"
                                        onClick={this.loadPrograms}/>
                                </div>
                                <div className="p-md-12 p-lg-6 p-toolbar-group-right">
                                    <Button label={"Compilar"} icon="fa fa-check" className="p-button-warning" style={{marginRight:".25em"}}
                                        onClick={this.compile}/>
                                    <Button icon="fa fa-step-forward" style={{marginRight:".25em"}}
                                        onClick={this.runNext}/>
                                    <Button icon="fa fa-play" className="p-button-success" style={{marginRight:".25em"}}
                                        onClick={this.run}/>
                                </div>
                            </Toolbar>
                            <Panel header="Acumulador" style={{marginTop:"2em"}}>
                                <h3><pre>{memory[0].value}</pre></h3>
                            </Panel>
                            <Accordion multiple={false}>
                                <AccordionTab header="Programas">
                                    <DataTable scrollable={true} scrollHeight="200px"
                                            value={programs.map((item, i) => {
                                        return {
                                            index: i,
                                            name: item.name
                                        }
                                    })}>
                                        <Column field="index" header="Índice" />
                                        <Column field="name" header="Nombre" />
                                    </DataTable>
                                </AccordionTab>
                                <AccordionTab header="Instrucciones">
                                    <DataTable scrollable={true} scrollHeight="200px"
                                        value={instructions.map((item, i) => {
                                        return {
                                            index: i,
                                            value: item.value
                                        }
                                    })}>
                                        <Column field="index" header="#" />
                                        <Column field="value" header="Código" />
                                    </DataTable>
                                </AccordionTab>
                                <AccordionTab header="Variables">
                                    <DataTable scrollable={true} scrollHeight="200px"
                                            value={variables.map((variable, i) => {
                                        return {
                                            programIndex: variable.programIndex,
                                            name: variable.name,
                                            value: JSON.stringify(variable.value),
                                            type: variable.varType
                                        }
                                    })}>
                                        <Column field="programIndex" header="Programa" />
                                        <Column field="name" header="Nombre" />
                                        <Column field="value" header="Valor" />
                                        <Column field="type" header="Tipo" />
                                    </DataTable>
                                </AccordionTab>
                                <AccordionTab header={"Memoria (" + memoryLength + ")"}>
                                    <DataTable scrollable={true} scrollHeight="200px"
                                            value={memory.map((item, i) => {
                                        return {
                                            index: i,
                                            value: item.value === null ? "--" : JSON.stringify(item.value)
                                        }
                                    })}>
                                        <Column field="index" header="Posición" />
                                        <Column field="value" header="Valor" />
                                    </DataTable>
                                </AccordionTab>
                            </Accordion>
                        </div>
                    }
                    <div className="p-col-12 p-md-8">
                        {instructions.length > 0 && this.getCurrentInstruction() &&
                            <div>
                                <h3>Velocidad: {speed}</h3>
                                <Slider value={speed} onChange={(e) => this.setState({speed: e.value})} min={10} max={100} />
                                <Panel header="Siguiente instrucción" style={{marginTop: "2em"}}>
                                    <pre>{this.getCurrentInstruction().value}</pre>
                                </Panel>
                            </div>
                        }
                        <Screen>
                            <ScrollPanel style={{height: "200px", marginTop: "2em"}}>
                                <Messages ref={(el) => this.messages = el} />
                            </ScrollPanel>
                        </Screen>
                        <Panel header="Salida">
                            {printer.map((line, i) => <pre key={i}>{line}</pre>)}
                        </Panel>
                        {errors.length > 0 && errors.map((e, i) => {
                            return <p key={i}>{e.message} (en {e.programName}:{e.line})</p>
                        })}
                    </div>
                </div>

                <Dialog header="Entrada" visible={this.state.showInputDialog} modal={true} closable={false} closeOnEscape={false}
                        onHide={() => this.setState({
                            showInputDialog: false,
                            currentInput: ""
                        })}>
                    <InputText id="input" keyfilter={this.state.currentInputFilter || null}
                        placeholder={this.state.currentInputFilter || ""} value={this.state.currentInput}
                        autoFocus={true}
                        onKeyUp={this.handleInputSubmit}
                        onChange={(e) => this.setState({currentInput: e.target.value})}/>
                    <label htmlFor="input">{}</label>
                </Dialog>
                <Growl ref={(el) => this.growl = el} />
            </div>
        );
    }
}
