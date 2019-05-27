import React from "react";
import {Editor as PrimeEditor} from "primereact/editor";
import {Toolbar} from "primereact/toolbar";
import {Button} from "primereact/button";
import {CH} from "./ch"

var textTest = `
// Programa para calcular el factorial de 5
nueva unidad I 1
nueva m I 5
nueva respuesta I 1
nueva intermedia I 0
cargue m
almacene respuesta
reste unidad
// Se inicia el ciclo de cálculo del factorial
almacene intermedia
cargue respuesta
multiplique intermedia
almacene respuesta
cargue intermedia
reste unidad
vayasi ciclo fin
etiqueta ciclo 9
etiqueta fin 21
muestre respuesta
imprima respuesta
retorne 0
`.split("\n").map(line => "<p>" + line + "</p>").join("").trim();
export class Editor extends CH {
    constructor(props) {
        super(props);
        this.onActionCompile = props.onCompile || (() => {})
    }

    componentWillMount = () => {
        this.setState({
            name: "Sin título",
            fontSize: 14,
            text: textTest
        });
    }

    onTextChange = e => {
        this.setState({
            text: e.htmlValue
        })
        this.props.onChange && this.props.onChange(e)
    }

    parsedText = string => {
        return string.replace(/(<br>)+/g, "")
            .replace(/(<p>)+/g, "")
            .replace(/<\/p>/g, "\n")
            .replace(/\n{2,}/g, "\n")
            .trim();
    }

    render() {
        const { name, text, fontSize, errors } = this.state;
        return (
            <div>
                <PrimeEditor
                    style={{
                        height:"320px", fontFamily: "monospace", fontSize: fontSize
                    }}
                    value={text}
                    onTextChange={this.onTextChange}
                    headerTemplate={(
                        <Toolbar>
                            <div className="p-toolbar-group-left">
                                <Button icon="fa fa-plus"/>
                                <Button icon="fa fa-download" className="p-button-success"/>
                            </div>
                            <div className="p-toolbar-group-right">
                                <Button icon="fa fa-check" className="p-button-warning" tooltip="Compilar" tooltipOptions={{position: "bottom"}}
                                        onClick={() => {
                                    this.onActionCompile({name: name, text: this.parsedText(text)})
                                }} />
                            </div>
                        </Toolbar>
                    )}/>
                {errors.length && (
                    <ul>
                        {errors.map((e, i) => {
                            return (<li key={i}>{e}</li>);
                        })}
                    </ul>
                )}
            </div>
        );
    }
}
