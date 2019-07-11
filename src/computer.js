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
import {Slider} from "primereact/slider";
import {RadioButton} from "primereact/radiobutton";
import {Spinner} from "primereact/spinner";
import {Toolbar} from "primereact/toolbar";

import {CH} from "./ch"
import {Screen} from "./screen";
import { program } from "@babel/types";

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

    setKernel = (newlength) => {
        let value = parseInt(newlength) || 0;
        if (value > 9999) return;
        const {memoryLength} = this.state;
        this.setState({
            kernelLength: value,
            memoryLength: Math.max(memoryLength, value + 1)
        })
    }

    setMemory = (newlength) => {
        let value = parseInt(newlength) || 0;
        if (value > 9999) return;
        const {kernelLength} = this.state;
        this.setState({
            memoryLength: value,
            kernelLength: Math.min(kernelLength, value)
        });
    }

    setMode = async(value) => {
        const {mode} = this.state;
        if (mode !== value) {
            await this.clearMemory(true);
            this.setState({
                mode: value
            }, this.initMemory)
        }
    }

    render() {
        const { mode, errors, memory, kernelLength, memoryLength, instructions, programs, printer, speed,
            showInputDialog, inputMessage, run, currentProgramIndex } = this.state;
        const variables = memory.filter(x => x.type === "var");

        return (
            <div>
                <div className="p-grid">
                    {memory.length > 0 &&
                        <div className="p-col-12 p-md-4">
                            <Toolbar>
                                <div className="p-md-12 p-lg-6 p-toolbar-group-left">
                                    <Button disabled={mode === "kernel"} tooltip="Nuevo" icon="fa fa-plus" style={{marginRight:".25em"}} tooltipOptions={{position: "top"}}
                                        onClick={() => this.clearMemory(true)}/>
                                    <Button disabled={mode === "kernel"} tooltip="Cargar" icon="fa fa-upload" className="p-button-success" tooltipOptions={{position: "top"}}
                                        onClick={this.loadPrograms}/>
                                </div>
                                <div className="p-md-12 p-lg-6 p-toolbar-group-right">
                                    <Button disabled={mode === "kernel"} tooltip="Compilar" icon="fa fa-check" className="p-button-warning" style={{marginRight:".25em"}} tooltipOptions={{position: "top"}}
                                        onClick={this.compile}/>
                                    <Button disabled={mode === "kernel" || !run} tooltip="Parar" icon="fa fa-stop" className="p-button-danger" style={{marginRight:".25em"}} tooltipOptions={{position: "top"}}
                                        onClick={() => this.setState({run: false})}/>
                                    <Button disabled={mode === "kernel" || instructions.length === 0} tooltip="Siguiente paso" icon="fa fa-step-forward" style={{marginRight:".25em"}} tooltipOptions={{position: "top"}}
                                        onClick={this.runNext}/>
                                    <Button disabled={mode === "kernel" || instructions.length === 0} tooltip="Ejecutar todo" icon="fa fa-play" className="p-button-success" style={{marginRight:".25em"}} tooltipOptions={{position: "top"}}
                                        onClick={this.run}/>
                                </div>
                            </Toolbar>
                            <Panel header="Modo" style={{marginTop:"2em"}}>
                                <div className="p-grid" style={{width:"250px",marginBottom:"10px"}}>
                                    <div className="p-col-12">
                                        <RadioButton inputId="rb1" name="mode" value="kernel" onChange={(e) => this.setMode(e.value)} checked={mode === "kernel"} />
                                        <label htmlFor="rb1" className="p-radiobutton-label">Kernel</label>
                                    </div>
                                    <div className="p-col-12">
                                        <RadioButton inputId="rb2" name="mode" value="user" onChange={(e) => this.setMode(e.value)} checked={mode === "user"} />
                                        <label htmlFor="rb2" className="p-radiobutton-label">Usuario</label>
                                    </div>
                                </div>
                            </Panel>
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon">
                                    Kernel
                                </span>
                                <Spinner disabled={mode !== "kernel"} value={kernelLength} onChange={(e) => this.setKernel(e.value)} min={0} max={9999} />
                            </div>
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon">
                                    Memory
                                </span>
                                <Spinner disabled={mode !== "kernel"} value={memoryLength} onChange={(e) => this.setMemory(e.value)} min={2} max={9999} />
                            </div>
                            <Panel header="Acumulador" style={{marginTop:"2em"}}>
                                <ScrollPanel style={{width: "100%", height: "80px"}}>
                                    <h3><pre>{memory[0].value}</pre></h3>
                                </ScrollPanel>
                            </Panel>
                            <Accordion multiple={false}>
                                <AccordionTab header="Programas">
                                    <DataTable scrollable={true} scrollHeight="200px"
                                            value={programs.map(({name, arrival, burst}, i) => {
                                        return {
                                            index: i,
                                            name,
                                            arrival,
                                            burst
                                        }
                                    })}>
                                        <Column field="index" header="Índice" />
                                        <Column field="arrival" header="Llegada" />
                                        <Column field="burst" header="Ráfaga" />
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
                                {programs[currentProgramIndex] && <h4>Programa actual: {programs[currentProgramIndex].name}</h4>}
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

                <Dialog header="Entrada" visible={showInputDialog} modal={true} closable={false} closeOnEscape={false}
                        onHide={() => this.setState({
                            showInputDialog: false,
                            currentInput: ""
                        })}>
                    <p>{inputMessage || ""}</p>
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
