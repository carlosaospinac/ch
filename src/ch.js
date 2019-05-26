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
        memoryLength: CH.defaultMemoryLength,
        kernelLength: CH.defaultKernelLength,
        programs: [],
        currentProgramIndex: 0,
        instructions: [],
        currentInstructionIndex: 0,
        errors: [],
        memory: [],  // <-- Arreglo de memoria
    }

    constructor(props) {
        super(props);
    }

    componentWillReceiveProps = ({programs}) => {
        this.setState({
            programs: programs
        })
    }

    componentDidMount = () => {
        this.init();
    }

    init = () => {
        this.initMemory();
    }

    initMemory = () => {
        let { memory, kernelLength, memoryLength } = this.state;
        memory = [{
            type: "acumulator",
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

    clearMemory = async() => {
        await this.setState(({ memory }) => {
            let start = memory.findIndex(el => el.type === "code");
            memory[0].value = 0;  // Restart accumulator
            return {
                memory: memory.slice(0, start).concat(memory.slice(start).map(() => ({
                    type: "free",
                    value: null
                }))),
                instructions: [],
                currentInstructionIndex: 0
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

    compile = async() => {
        /* Carga todos los programas a memoria */
        this.clearMemory();

        const { programs } = this.state;
        let { memory } = this.state;
        let newItems = [], instructions = [];
        for (let i = 0; i < programs.length; i++) {
            const program = programs[i];
            if (!this.checkSyntax(program)) {
                return;
            }
            const lines = program.text.split("\n");
            if (lines.length > this.getFreeMemory()) {
                this.logError("Memoria insuficiente para cargar: " + program.name);
                return;
            }

            for (let j = 0; j < lines.length; j++) {
                const line = lines[j].trim();
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
                if (!line.startsWith("//")) {
                    instructions.push(newItem);
                }
            }
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
        const {instructions, currentInstructionIndex} = this.state;
        if (!this.hasNext()) {
            this.finish();
            return;
        }
        this.runInstruction(instructions[currentInstructionIndex]);
        await this.setState(({currentInstructionIndex}) => ({
            currentInstructionIndex: currentInstructionIndex + 1
        }));
    }

    hasNext = () => {
        const {instructions, currentInstructionIndex} = this.state;
        return instructions.length > currentInstructionIndex;
    }

    /* run = () => {
        if (this.hasNext()) {
            this.runNext(this.run);
        }
    } */

    run = async () => {
        const {instructions, currentInstructionIndex} = this.state;
        for (let i = currentInstructionIndex; i < instructions.length; i++) {
            const instruction = instructions[i];
            await this.runInstruction(instruction);
        }
    }

    showMemoryError = () => {
        this.showAlert("error", "Error!", "No hay memoria disponible para continuar.");
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

    checkSyntax = program => {
        /* [TODO] */
        return true;
    }

    splitInstruction = (instruction) => {
        return [
            instruction.substr(0,instruction.indexOf(" ")),
            instruction.substr(instruction.indexOf(" ") + 1)
        ];
    }

    getValue = variable => {
        const { memory, currentProgramIndex } = this.state;

        return memory.find(({programIndex, name}) => (
            programIndex === currentProgramIndex && name === variable
        )).value;
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

    getFreeMemory = () => {
        return this.getMemoryByType("free").length;
    }

    getMemoryByType = (type) => {
        return this.state.memory.filter(item => item.type === type);
    }

    getParsedValue = (value, type) => {
        switch (type) {
            case "C": return String(value);
            case "I": return parseInt(value);
            case "R": return parseFloat(value);
            case "L": return value !== "0";
            default: return value;
        }
    }

    checkMemoryAvaliable = () => {
        if (this.getFreeMemory() === 0) {
            this.showMemoryError();
        }
        return true;
    }

    runInstruction = async(instruction) => {
        let ins = this.splitInstruction(instruction.value.trim());
        switch (ins[0]) {
            case "cargue":
                await this.rCargue(ins[1]);
                break;
            case "nueva":
                await this.rNueva(ins[1]);
                break;
            case "almacene":
                await this.rAlmacene(ins[1]);
                break;
            case "reste":
                await this.rReste(ins[1]);
                break;

            case "multiplique":
                await this.rMultiplique(ins[1]);
                break;

            default:
                break;
        }
    }

    /* Funciones CHMAQUINA */

    rNueva = async(operando) => {
        if (!this.checkMemoryAvaliable()) {
            return;
        }

        let regex = /^((?=[^\d])\w+) +([CIRL]) +(.+)$/;
        let match = operando.match(regex);
        let name = match[1];
        let type = match[2];
        let value = match[3];
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

    rVaya = async(operando) => {

    }

    rVayaSi = async(operando) => {

    }

    rEtiqueta = async(operando) => {

    }

    rLea = async(operando) => {

    }

    rSume = async(operando) => {
        await this.setAccumulator(this.getAccumulator() - this.getValue(operando));
    }

    rReste = async(operando) => {
        await this.setAccumulator(this.getAccumulator() - this.getValue(operando));
    }

    rMultiplique = async(operando) => {
        await this.setAccumulator(this.getAccumulator() * this.getValue(operando));
    }

    rDivida = async(operando) => {

    }

    rPotencia = async(operando) => {

    }

    rModulo = async(operando) => {

    }

    rConcatene = async(operando) => {

    }

    rElimine = async(operando) => {

    }

    rExtraiga = async(operando) => {

    }

    rY = async(operando) => {

    }

    rO = async(operando) => {

    }

    rNO = async(operando) => {

    }

    rMuestre = async(operando) => {

    }

    rImprima = async(operando) => {

    }

    rXXXX = async(operando) => {

    }

    rRetorne = async(operando) => {

    }
    /* FIN Funciones CHMAQUINA */

    logError = message => {
        this.setState(prevState => ({
            errors: [...prevState.errors, message]
        }));
    }

    finish = () => {
        this.showAlert("info", "Programa ha finalizado.");
    }

    showAlert(type, message=null, detail=null) {
        alert(message + detail && (": " + detail));
        this.growl.show({severity: type, summary: message, detail: detail});
    }

    render() {
        return false;
    }
}
