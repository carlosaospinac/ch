import React from "react";
import {Card} from "primereact/card";
import {TabView,TabPanel} from "primereact/tabview";

import {Computer} from "./computer"
import {Editor} from "./editor"

// import classnames from "classnames";
// import logo from "./logo.svg";
import "./App.css";

export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.computer = React.createRef();
        this.editor = React.createRef();
        this.state = {
            programList: [],
            activeTabIndex: 0
        }
    }

    onEditorCompile = async(program) => {
        await this.setState({
            activeTabIndex: 0,
            programList: [{index: 0, ...program}]
        });
        this.computer.current.compile();
    }

    render() {
        const { activeTabIndex, programList } = this.state;

        return (
            <div>
                <TabView renderActiveOnly={false} activeIndex={activeTabIndex} onTabChange={e => this.setState({activeTabIndex: e.index})}>
                    <TabPanel header="CH-Computador">
                        <Computer ref={this.computer} programs={programList} onLoadPrograms={e => this.setState({programList: e})}></Computer>
                    </TabPanel>
                    <TabPanel ref={this.editor} header="Editor">
                        <Editor onCompile={this.onEditorCompile}></Editor>
                    </TabPanel>
                    <TabPanel ref={this.editor} header="Acerca de">
                        <Card title="CH-MÁQUINA" subTitle="Sistemas Operativos" style={{width: "100%"}}
                                className="ui-card-shadow"
                                header={(
                                    <div className="crop">
                                        <img alt="Header" src={require("./media/wall.jpg")}/>
                                    </div>
                                )}>
                            <div className="p-grid">
                                <div className="p-col-12 p-md-8">
                                    <b>Por <a href="http://github.com/carlosaospinac" target="_blank">Carlos A. Ospina </a></b>
                                    <p>Simpulación del funcionamiento básico de un chcomputador.</p>
                                    <p>
                                        Esta aplicación simula un procesador muy elemental y una memoria principal a través de un vector de 9999 posiciones, las cuales pueden ser variadas al momento de iniciar el programa.
                                        El chcomputador empieza con 100 posiciones de memoria.
                                    </p>
                                    <p>
                                        Está hecho para que pueda leer un conjunto de programas en un seudo-lenguaje denominado CHMAQUINA (extensión <span className="plain">.ch</span>) y los cargarlos en las posiciones disponibles de la memoria.
                                    </p>
                                </div>
                                <div className="p-col-12 p-md-4">
                                    <div className="unal">
                                        <img alt="Unal" src={require("./media/unal.png")}/>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </TabPanel>
                </TabView>
            </div>
        );
    }
}
