import React from "react";

/* memory item structure:
{
    type | acumulador, kernel, code, free, var
    name
    value
    tag
    type
}
*/
export class CH extends React.Component {
    static defaultMemoryLength = 100;
    static defaultKernelLength = 10 * 4 + 9;

    state = {
        mode: "kernel",
        running: false,
        run: false,
        speed: 100,
        memoryLength: CH.defaultMemoryLength,
        kernelLength: CH.defaultKernelLength,
        programs: [],
        currentProgramIndex: 0,
        instructions: [],
        currentInstructionIndex: 0,
        tags: {},
        errors: [],
        printer: [],
        memory: [],  // <-- Arreglo de memoria
        showInputDialog: false,
        inputMessage: "",
        currentInput: "",
        currentInputType: ""
    }

    componentWillReceiveProps = async({programs}) => {
        if (!programs || !programs.length) { return; }
        let newPrograms = [{
            ...programs[0],
            arrival: 0,
            lines: await this.getLines(programs[0])
        }];
        newPrograms[0].burst = newPrograms[0].lines.length;
        for (let _i = 1; _i < programs.length; _i++) {
            const program = programs[_i];
            const lines = await this.getLines(program);
            newPrograms.push({
                ...program,
                lines,
                burst: lines.length,
                arrival: newPrograms[_i - 1].arrival + parseInt(lines.length / 4)
            });
        }

        this.setState({programs: newPrograms});
    }

    componentDidMount = () => {
        this.init();
    }

    componentDidUpdate = () => {
        console.log(this.state);
    }

    init = () => {
        this.initMemory();
    }

    initMemory = () => {
        let { memory, kernelLength, memoryLength } = this.state;
        memory = [{
            type: "accumulator",
            name: "acumulador",
            value: 0
        }];

        for (let index = 0; index < kernelLength; index++) {
            memory.push({
                type: "kernel",
                value: Math.random().toString(36).substring(7)
            });
        }
        while (memory.length < memoryLength) {
            memory.push({
                type: "free",
                value: null
            });
        }

        this.setState({
            currentInstructionIndex: 0,
            memory: memory
        });
    }

    clearMemory = async(all) => {
        await this.setState(({ memory }) => {
            let start = memory.findIndex(el => el.type === "code");
            memory[0].value = 0;  // Restart accumulator
            return {
                memory: memory.slice(0, start).concat(memory.slice(start).map(() => ({
                    type: "free",
                    value: null
                }))),
                instructions: [],
                errors: [],
                tags: {},
                currentInstructionIndex: 0,
                currentProgramIndex: 0,
                ...(all ? {programs: []} : {})
            }
        });
    }

    getAccumulator = () => {
        return this.state.memory[0].value;
    }

    setAccumulator = async(value) => {
        let { memory } = this.state;
        memory[0].value = value;
        await this.setState({
            memory: memory
        });
    }

    getCurrentProgram = () => {
        const { programs, currentProgramIndex } = this.state;
        return programs[currentProgramIndex];
    }

    getCurrentInstruction = () => {
        const { instructions, currentInstructionIndex } = this.state;
        return instructions[currentInstructionIndex];
    }

    getLines = async(program) => {
        const lines = program.text.split("\n");
        if (lines.length > (await this.getFreeMemory())) {
            this.showAlert("Error", "Memoria insuficiente", "No se podrá compilar " + program.name);
            return;
        }
        return lines.filter(line => line);
    }

    compile = async() => {
        this.setState({mode: "user"});
        /* Carga todos los programas a memoria */
        await this.clearMemory();

        const { programs } = this.state;
        let { memory } = this.state;
        let newItems = [], instructions = [];
        let start = 0;
        let tagsFound = {};
        for (let i = 0; i < programs.length; i++) {
            const program = programs[i];
            for (const line of program.lines) {
                if (!line) {
                    continue;
                }
                let newItem = {
                    type: "code",
                    programIndex: program.index,
                    value: line
                }
                newItems.push(newItem);
                Object.assign(
                    memory, {
                        [this.getNextFreePosition()]: newItem
                    }
                )
                instructions.push(newItem);
                if (line.match(/^etiqueta\s+\w+\s+\d+$/)) {
                    let ins = line.split(/\s+/);
                    tagsFound[i + "_" + ins[1]] = parseInt(ins[2]) + start
                }
            }
            await this.setState({
                tags: tagsFound
            });
            await this.setState(({programs}) => {
                programs[i].start = start;
                programs[i].end = start + program.lines.length;
                return {
                    progams: programs
                }
            });
            start = program.lines.length;
        }
        await this.setState({
            memory: memory,
            instructions: instructions
        });
    }

    getNextFreePosition = () => {
        const { memory } = this.state;
        for (let index = 0; index < memory.length; index++) {
            if (memory[index].type === "free") {
                return index;
            }
        }
        return -1;
    }

    runNext = async() => {
        if (this.hasNext()) {
            await this.runInstruction(this.getCurrentInstruction());
        } else {
            this.finish();
        }
    }

    hasNext = () => {
        const {instructions, currentInstructionIndex} = this.state;
        return instructions.length > currentInstructionIndex;
    }

    run = async() => {
        await this.setState({run: true});
        while (this.state.run && this.hasNext()){
            await this.runInstruction(this.getCurrentInstruction());
            await this.sleep(1000 / this.state.speed);
        }
    }

    showMemoryError = () => {
        this.showAlert("error", "Error!", "No hay memoria disponible para continuar.");
        this.finish();
    }

    saveToMemory = async(item) => {
        let freePosition = this.getNextFreePosition();
        if (!freePosition === -1) {
            this.showMemoryError();
            return false;
        }
        await this.setState(({ memory }) => ({
            memory: Object.assign(
                memory, {
                    [freePosition]: item
                }
            )
        }));
    }

    checkSyntax = (text, programName) => {
        const rxNueva = /^nueva +(\w+) +[CIRL]( +(?=\S).{1,255})?/;
        const rxOperable = /^(cargue|almacene|lea|sume|reste|multiplique|divida|modulo|potencia|concatene|elimine|extraiga|muestre|imprima) +([^\d\W]\w*|".+"|\d+)$/;
        const rxMaximo = /^maximo +(\w+) +((([^\d\W]\w*|".+"|\d+) *)+)$/;
        const rxVaya = /^vaya +(\w+)$/;
        const rxVayaSi = /^vayasi +(\w+) +(\w+)$/;
        const rxEtiqueta = /^etiqueta +(\w{1,255}) +(\d+)$/;
        const rxRetorne = /^retorne( *(\d+))?$/
        const lines = text.trimRight().split("\n").map(line => line.trim());
        let vars = new Set(["acumulador"]);
        let tagsGoTo = new Set();
        let tagsGoToLines = {};
        let tags = new Set();
        let newErrors = [];
        let alreadyEnd = false;
        if (!lines.length) {
            newErrors.push({
                message: "No hay instrucciones válidas.",
                programName: programName
            });
        }

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line.length || line.startsWith("//")) {
                continue;
            }
            let m;
            if (m = line.match(rxNueva)) {
                if (m[1] === "acumulador") {
                    newErrors.push({
                        message: "'acumulador' es una variable reservada del sistema.",
                        programName: programName,
                        line: i + 1
                    });
                }
                if (vars.has(m[1])) {
                    newErrors.push({
                        message: "Variable '" + m[1] + "' ya ha sido definida.",
                        programName: programName,
                        line: i + 1
                    });
                }
                vars.add(m[1]);
            } else if (m = line.match(rxOperable)) {
                if (!vars.has(m[2])) {
                    let constNumberMatch = m[2].match(/^(\d+(\.\d+)?)$/);
                    let constStringMatch = m[2].match(/^"(.+)"$/);
                    if (!(constNumberMatch || constStringMatch)) {
                        newErrors.push({
                            message: "Variable '" + m[2] + "' es usada antes de ser definida.",
                            programName: programName,
                            line: i + 1
                        });
                    }
                }
            } else if (m = line.match(rxMaximo)) {
                let operatings = [m[1], ...m[1].trim().split(/\s+/)];
                for (const x of operatings) {
                    if (!vars.has(x)) {
                        let constNumberMatch = x.match(/^(\d+(\.\d+)?)$/);
                        let constStringMatch = x.match(/^"(.+)"$/);
                        if (!(constNumberMatch || constStringMatch)) {
                            newErrors.push({
                                message: "Variable '" + x + "' es usada antes de ser definida.",
                                programName: programName,
                                line: i + 1
                            });
                        }
                    }
                }
            } else if (m = line.match(rxVaya)) {
                tagsGoTo.add(m[1]);
                tagsGoToLines[m[1]] = i;
            } else if (m = line.match(rxVayaSi)) {
                tagsGoTo.add(m[1]);
                tagsGoToLines[m[1]] = i;
                tagsGoTo.add(m[2]);
                tagsGoToLines[m[2]] = i;
            } else if (m = line.match(rxEtiqueta)) {
                tags.add(m[1]);
                tagsGoToLines[m[1]] = i;
            } else if (m = line.match(rxRetorne)) {
                if (alreadyEnd) {
                    newErrors.push({
                        message: "El operados 'retorne' debe estar sólo una vez.",
                        programName: programName,
                        line: i + 1
                    });
                } else if (i < lines.length - 1) {
                    newErrors.push({
                        message: "El operador 'retorne' debe estar al final del programa.",
                        programName: programName,
                        line: i + 1
                    });
                }
                alreadyEnd = true;
            } else {
                newErrors.push({
                    message: "Error de sintaxis. Expresión desconocida.",
                    programName: programName,
                    line: i + 1
                });
            }
        }
        if (tagsGoTo.size) {
            let undefinedTags = [...tagsGoTo].filter(x => !tags.has(x));
            if (undefinedTags.length) {
                for (let i = 0; i < undefinedTags.length; i++) {
                    const undefinedTag = undefinedTags[i];
                    newErrors.push({
                        message: "Etiqueta '" + undefinedTag + "' no ha sido definida.",
                        programName: programName,
                        line: tagsGoToLines[undefinedTag]
                    });
                }
            }
        }
        if (!alreadyEnd) {
            newErrors.push({
                message: "Se espera el operador 'retorne' al final.",
                programName: programName,
                line: lines.length
            });
        }
        if (newErrors.length) {
            this.setState(({errors}) => ({
                errors: errors.concat(newErrors)
            }));
            this.showAlert("error", "Errores en " + programName);
            return false;
        }
        return true;
    }

    splitInstruction = (instruction) => {
        return [
            instruction.substr(0,instruction.indexOf(" ")).trim(),
            instruction.substr(instruction.indexOf(" ") + 1).trim()
        ];
    }

    getVar = variable => {
        const { memory, currentProgramIndex } = this.state;

        return memory.find(({programIndex, name}) => (
            programIndex === currentProgramIndex && name === variable
        ));
    }

    getValue = variable => {
        if (variable === "acumulador") {
            return this.getAccumulator();
        }
        let constNumberMatch = variable.match(/^(\d+(\.\d+)?)$/);
        let constStringMatch = variable.match(/^"(.+)"$/);
        if (constNumberMatch) {
            return parseFloat(variable);
        }
        if (constStringMatch) {
            return constStringMatch[1];
        }
        return this.getVar(variable).value;
    }

    setValue = async(variable, newValue) => {
        const { memory, currentProgramIndex } = this.state;
        let newMemory = memory;
        newMemory.find(({programIndex, name}) => (
            programIndex === currentProgramIndex && name === variable
        )).value = newValue;
        await this.setState({
            memory: newMemory
        });
    }

    getFreeMemory = async() => {
        if (this.getMemoryByType("free").length === 0) {
            let {memoryLength, memory} = this.state;
            if (memoryLength === 9999) {
                this.showMemoryError();
            } else {
                memoryLength = Math.min(9999, memoryLength + 100);
                while (memory.length < memoryLength) {
                    memory.push({
                        type: "free",
                        value: null
                    });
                }
                await this.setState({
                    memoryLength: memoryLength,
                    memory: memory
                })
            }
        }
        return this.getMemoryByType("free").length;
    }

    getMemoryByType = (type) => {
        return this.state.memory.filter(item => item.type === type);
    }

    getParsedValue = (value, type) => {
        switch (type) {
            case "C": return String(value) || "";
            case "I": return parseInt(value) || 0;
            case "R": return parseFloat(value) || 0;
            case "L": return value && value !== "0" ? 1 : 0;
            default: return value;
        }
    }

    checkMemoryAvaliable = async() => {
        if ((await this.getFreeMemory()) === 0) {
            this.showMemoryError();
        }
        return true;
    }

    runInstruction = async(instruction) => {
        this.setState({running: true});
        let alpha = 1;
        let ins = this.splitInstruction(instruction.value.trim());
        switch (ins[0]) {
            case "nueva":
                await this.rNueva(ins[1]);
                break;
            case "cargue":
                await this.rCargue(ins[1]);
                break;
            case "almacene":
                await this.rAlmacene(ins[1]);
                break;
            case "lea":
                await this.rLea(ins[1]);
                break;
            case "sume":
                await this.rSume(ins[1]);
                break;
            case "reste":
                await this.rReste(ins[1]);
                break;
            case "multiplique":
                await this.rMultiplique(ins[1]);
                break;
            case "divida":
                await this.rDivida(ins[1]);
                break;
            case "modulo":
                await this.rModulo(ins[1]);
                break;
            case "potencia":
                await this.rPotencia(ins[1]);
                break;

            case "concatene":
                await this.rConcatene(ins[1]);
                break;
            case "elimine":
                await this.rElimine(ins[1]);
                break;
            case "extraiga":
                await this.rExtraiga(ins[1]);
                break;

            case "vaya":
                await this.rVaya(ins[1]);
                alpha = 0;
                break;
            case "vayasi":
                alpha = await this.rVayaSi(ins[1]);
                break;
            case "Y":
                await this.rY(ins[1]);
                break;
            case "O":
                await this.rO(ins[1]);
                break;
            case "NO":
                await this.rNO(ins[1]);
                break;
            case "muestre":
                await this.rMuestre(ins[1]);
                break;
            case "imprima":
                await this.rImprima(ins[1]);
                break;
            case "maximo":
                await this.rMaximo(ins[1]);
                break;

            case "retorne":
                await this.rRetorne(ins[1]);
                break;

            default:
                break;
        }
        if (alpha) {
            await this.setState(({currentInstructionIndex}) => ({
                currentInstructionIndex: currentInstructionIndex + alpha,
                running: false
            }));
        } else {
            this.setState({running: false});
        }
    }

    goToTag = async(tagName) => {
        const {tags, currentProgramIndex} = this.state;
        await this.setState({
            currentInstructionIndex: tags[currentProgramIndex + "_" + tagName]
        })
    }

    getContitionalMatch = (operating) => {
        let regex = /^(.+)\b +(.+)\b +((?=[^\d])\w+)$/;
        let match = operating.match(regex);
        return {
            op1: this.getValue(match[1]),
            op2: this.getValue(match[2]),
            variable: match[3]
        }
    }

    handleInputSubmit = async(e) => {
        if (e.keyCode === 13) {
            this.setState({
                showInputDialog: false,
                inputMessage: ""
            });
            this.onInputSubmit(e.target.value);
        }
    }

    onInputSubmit = () => {}
    input = () => {
        document.getElementById("input").focus();
        return new Promise(resolve => {
            this.onInputSubmit = resolve;
        });
    }

    /* Funciones CHMAQUINA */

    rNueva = async(operando) => {
        if (!(await this.checkMemoryAvaliable())) {
            return;
        }

        let regex = /^((?=[^\d])\w+) +([CIRL])( +(.+))?$/;
        let match = operando.match(regex);
        let name = match[1];
        let type = match[2];
        let value = match[4];
        return await this.saveToMemory({
            type: "var",
            varType: type,
            programIndex: this.state.currentProgramIndex,
            name: name,
            value: this.getParsedValue(value, type)
        });
    }

    rCargue = async(operando) => {
        await this.setAccumulator(this.getValue(operando));
    }

    rAlmacene = async(operando) => {
        await this.setValue(operando, this.getAccumulator());
    }

    rLea = async(operando) => {
        let variable = this.getVar(operando);
        let inputFilter;
        let newValue;
        switch (variable.varType) {
            case "I":
                inputFilter = "int"
                break;
            case "R":
                inputFilter = "num"
                break;
            case "L":
                inputFilter = /^[10]$/
                break;
            default:
                break;
        }
        await this.setState({
            currentInputFilter: inputFilter,
            showInputDialog: true,
            inputMessage: "Ingrese el valor para '" + operando + "'"
        });
        newValue = this.getParsedValue(await this.input(), variable.varType);
        await this.setValue(operando, newValue);
    }

    rSume = async(operando) => {
        await this.setAccumulator(this.getAccumulator() + this.getValue(operando));
    }

    rReste = async(operando) => {
        await this.setAccumulator(this.getAccumulator() - this.getValue(operando));
    }

    rMultiplique = async(operando) => {
        await this.setAccumulator(this.getAccumulator() * this.getValue(operando));
    }

    rDivida = async(operando) => {
        let a = this.getAccumulator();
        let b = this.getValue(operando);
        if (b === 0) {
            await this.setState({
                currentInputFilter: "int",
                showInputDialog: true,
                inputMessage: "No es posible hacer una división entre cero. ¿Qué valor desea asumir para " + a + "/" + b + "?"
            });
            let response = await this.input();
            if (!response) {
                this.finish("error");
            } else {
                await this.setAccumulator(a / parseFloat(response));
            }
        } else {
            await this.setAccumulator(a / b);
        }
    }

    rModulo = async(operando) => {
        await this.setAccumulator(this.getAccumulator() % this.getValue(operando));
    }

    rPotencia = async(operando) => {
        await this.setAccumulator(Math.pow(this.getAccumulator(), this.getValue(operando)));
    }

    rConcatene = async(operando) => {
        await this.setAccumulator(this.getAccumulator().toString() + this.getValue(operando));
    }

    rElimine = async(operando) => {
        await this.setAccumulator(this.getAccumulator().replace(this.getValue(operando), ""));
    }

    rExtraiga = async(operando) => {
        await this.setAccumulator(this.getAccumulator().slice(this.getValue(operando)));
    }

    rVaya = async(operando) => {
        await this.goToTag(operando);
    }

    rVayaSi = async(operando) => {
        let operating = operando.trim().split(/\s+/);
        let accumulator = this.getAccumulator();
        let target;
        if (accumulator === 0) {
            return 2;
        }
        if (accumulator > 0) {
            target = operating[0];
        } else if (accumulator < 0) {
            target = operating[1];
        }
        await this.goToTag(target);
        return 0;
    }

    rY = async(operando) => {
        let {variable, op1, op2} = this.getContitionalMatch(operando);
        await this.setValue(variable, op1 && op2 ? 1 : 0);
    }

    rO = async(operando) => {
        let {variable, op1, op2} = this.getContitionalMatch(operando);
        await this.setValue(variable, op1 || op2 ? 1 : 0);
    }

    rNO = async(operando) => {
        let operating = operando.trim().split(/\s+/);
        await this.setValue(operating[1], this.getValue(operating[0]) ? 0 : 1);
    }

    rMuestre = async(operando) => {
        this.show(null, this.getValue(operando));
    }

    rImprima = async(operando) => {
        await this.setState(state => ({
            printer: [...state.printer, this.getValue(operando)]
        }));
    }

    rMaximo = async(operando) => {
        let operating = operando.trim().split(/\s+/);
        let values = operating.slice(1).map(value => this.getValue(value));

        await this.setValue(operating[0], Math.max(...values));
    }

    rRetorne = async(operando) => {
        await this.finish(parseInt(operando) ? "error": "info", true);
    }
    /* FIN Funciones CHMAQUINA */

    finish = async(type="info", continues) => {
        const {currentProgramIndex} = this.state;
        let newState = {
            run: false
        };
        if (continues) {
            Object.assign(newState, {
                currentProgramIndex: currentProgramIndex + 1,
            });
            this.showAlert(type, "Programa " + this.getCurrentProgram().name + " ha finalizado.");
        } else {
            Object.assign(newState, {
                currentInstructionIndex: 0,
                instructions: [],
                tags: {}
            });
            this.showAlert(type, "Eso es todo.");
        }
        await this.setState(newState);
    }

    showAlert = (type=null, message=null, detail=null) => {}

    show = (type=null, message=null, detail=null) => {}

    sleep = ms => {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    readFile = (file) => {
        return new Promise(resolve => {
            let reader = new FileReader();
            reader.onload = e => {
                let content = e.target.result;
                resolve(content);
            };
            reader.readAsText(file);
        });
    }

    loadPrograms = async() => {
        let files = Array.from(await this.openFiles());
        let newPrograms = [];
        let index = 0;
        for (const file of files) {
            const content = await this.readFile(file);
            let text = content.trim();
            if (!this.checkSyntax(text, file.name)) {
                break;
            }
            newPrograms.push({
                index: index++,
                name: file.name,
                text: text
            });
        }
        this.props.onLoadPrograms(newPrograms);
        await this.setState({
            programs: newPrograms
        });
        if (newPrograms.length) {
            this.showAlert("success", "Listo para compilar", newPrograms.length + " programa" + (newPrograms.length > 1 ? "s" : ""))
        }
    }

    openFiles = (multiple=true) => {
        return new Promise(resolve => {
            let input = document.createElement("input");
            Object.assign(input, {
                type: "file",
                multiple: multiple,
                accept: ".ch",
                onchange: e => {
                    let files = e.target.files;
                    resolve(files);
                }
            });
            input.click();
        });
    }

    render() {
        return false;
    }
}
