import React from "react";
import AceEditor from "react-ace";

import {Toolbar} from "primereact/toolbar";
import {Button} from "primereact/button";
import {InputText} from "primereact/inputtext";

/* import "brace/mode/golang";
import "brace/theme/github"; */

import {CH} from "./ch"


export class Editor extends CH {

    constructor(props) {
        super(props);
        this.defaultName = "Sin titulo";
        this.onCompile = props.onCompile || (() => {})
    }

    componentWillMount = () => {
        this.fontSizes = [14, 16, 18, 20, 14, 28, 32, 40];
        this.setState({
            name: "",
            fontSizeIndex: 0,
            text: "",
            code: ""
        });
    }

    onActionCompile = async() => {
        const name = this.state.name || this.defaultName;
        const code = this.state.code;
        await this.setState({errors: []});
        if (this.checkSyntax(code, name)) {
            this.onCompile({name: name, text: code});
        }
    }

    onChange = code => {
        this.setState({
            code: code
        }, () => {
            this.props.onChange && this.props.onChange(code)
        })
    }

    uploadFile = async() => {
        let file = Array.from(await this.openFiles(false))[0];
        let content = await this.readFile(file);
        this.setState({
            code: content,
            name: file.name.slice(0, file.name.length - 3),
            errors: []
        })
    }

    downloadFile = () => {
        const { name, code } = this.state;
        let textToWrite = code;
        let textFileAsBlob = new Blob([textToWrite], {type:"text/plain"});
        let fileNameToSaveAs = name || this.defaultName;

        let downloadLink = document.createElement("a");
        downloadLink.download = fileNameToSaveAs + ".ch";
        downloadLink.innerHTML = "Download File";
        if (window.webkitURL != null) {
            // Chrome allows the link to be clicked
            // without actually adding it to the DOM.
            downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
        } else {
            // Firefox requires the link to be added to the DOM
            // before it can be clicked.
            downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
            downloadLink.onclick = downloadLink.parentNode.removeChild(downloadLink);
            downloadLink.style.display = "none";
            document.body.appendChild(downloadLink);
        }

        downloadLink.click();
    }

    render() {
        const { name, code, fontSizeIndex, errors } = this.state;
        return (
            <div spellCheck={false}>
                <Toolbar>
                    <div className="p-toolbar-group-left">
                        <Button icon="fa fa-plus" tooltip="Nuevo" tooltipOptions={{position: "top"}}
                            onClick={() => this.setState({code: ""}, this.clearMemory) } />
                        <Button icon="fa fa-upload" className="p-button-success" tooltip="Cargar" tooltipOptions={{position: "top"}}
                            onClick={this.uploadFile}/>
                        <div className="p-inputgroup" style={{display: "inline", marginLeft: "10px"}}>
                            <InputText placeholder="Sin título" value={name}
                                onChange={e => this.setState({name: e.target.value})} />
                            <span className="p-inputgroup-addon">.ch</span>
                        </div>
                        <Button icon="fa fa-download" className="p-button-info" tooltip="Descargar" tooltipOptions={{position: "top"}}
                            onClick={this.downloadFile} />
                        <Button icon="fa fa-search-plus" disabled={fontSizeIndex === this.fontSizes.length - 1}
                            onClick={() => this.setState({fontSizeIndex: Math.min(this.fontSizes.length - 1, fontSizeIndex + 1)})} />
                        <Button icon="fa fa-search-minus" disabled={fontSizeIndex === 0}
                            onClick={() => this.setState({fontSizeIndex: Math.max(0, fontSizeIndex - 1)})} />
                    </div>
                    <div className="p-toolbar-group-right">
                        <Button icon="fa fa-check" className="p-button-warning" tooltip="Compilar" tooltipOptions={{position: "top"}}
                                onClick={this.onActionCompile} />
                    </div>
                </Toolbar>
                <AceEditor
                    style={{width: "100%"}}
                    name="ch-editor"
                    mode="golang"
                    theme="tomorrow"
                    placeholder="Escriba su código CH"
                    fontSize={this.fontSizes[fontSizeIndex]}
                    //onLoad={this.onLoad}
                    onChange={this.onChange}
                    //showPrintMargin={true}
                    //showGutter={true}
                    //highlightActiveLine={true}
                    value={code}
                    setOptions={{
                        enableBasicAutocompletion: false,
                        enableLiveAutocompletion: false,
                        enableSnippets: false,
                        showLineNumbers: true,
                        tabSize: 2,
                    }}
                    />

                {errors.length > 0 && errors.map((e, i) => {
                    return <p key={i}>{e.message} (en {e.programName}:{e.line})</p>
                })}
            </div>
        );
    }
}
