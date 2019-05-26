import React from "react";
import {TabView,TabPanel} from "primereact/tabview";

import {Editor} from "./editor"
import {Computer} from "./computer"

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
                        <Computer ref={this.computer} programs={programList}></Computer>
                    </TabPanel>
                    <TabPanel ref={this.editor} header="Editor">
                        <Editor onChange={(e) => {console.log(e.textValue);}}
                            onCompile={this.onEditorCompile}></Editor>
                    </TabPanel>
                </TabView>
            </div>
        );
    }
}
