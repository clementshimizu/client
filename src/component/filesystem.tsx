import React = require("react")
import {EntryBox, Dropdown, Bar} from "./"
import {Button, ButtonGroup, ButtonToolbar, Table, Glyphicon, Input, ListGroup, ListGroupItem} from "react-bootstrap"
import {FileSystemState, fileSystemStore, isLoaded} from "../store"
import {fileSystemActions, messageActions} from "../action"
import {bytesToSize, lastPathSegment, downloadFile} from "../util"
import {sendCommandToDefault, sendCommandAsync} from "../socket"
import {AutoAffix} from "react-overlays"

export class FileList extends React.Component<{}, FileSystemState> {
    box: EntryBox
    upload: any
    fileDownloading: string = ""
    componentDidMount() {
        this.updateState(fileSystemStore.getState())
        fileSystemStore.listen(this.updateState)
    }
    componentWillUnmount() {
        fileSystemStore.unlisten(this.updateState)
    }
    updateState = (state: FileSystemState) => {
        this.setState(state)
        if (this.box) {
            this.box.setState({customized: false})
        }
        _.forOwn(state.downloads, (v: FileSystemInfo.LoadedFile, k) => {
            if (isLoaded(v)) {
                v.path = k
                downloadFile(v)
            }
        })
    }
    openFolder = (path: string) => {
        sendCommandToDefault("createFileTree", path)
    }
    goBack = () => {
        if (this.state.pathStack.length > 1) {
            fileSystemActions.goBack()
            //this.openFolder(this.state.pathStack[0].RootFolder.Name)
        }
    }
    refresh = (path: string) => {
        sendCommandAsync("createFileTree", path, fileSystemActions.reloadFileTree)
    }
    handleUpload = (e) => {
        let reader = new FileReader()
        
        reader.onload = ee => {
            messageActions.message({style: "success", text: "File upload started."})
            sendCommandToDefault("uploadFile", [
                this.state.tree.RootFolder.Name + "\\" + readerAny.name,
                [].slice.call(new Int8Array((ee.target as any).result))
            ])
        }
        reader.onerror = function (e) {
            console.error(e);
		}
        console.log(e.target.files)
        let readerAny = (reader as any)
        readerAny.name = e.target.files[0].name
        reader.readAsArrayBuffer(e.target.files[0])
    }
    download = (path: string) => {
        sendCommandToDefault("requestFile", path)
    }
    render() {
        if (!this.state || !this.state.tree) {
            console.log(this.state)
            return <div>loading files...</div>
        }
            
        let {tree} = this.state
        return <div>
            {/* this.state.pathStack.map(tree => tree.RootFolder.Name) */}
            {/* this.state.pathStack.indexOf(this.state.tree) */}
            <input ref={ref => this.upload = ref} className="upload" type="file" onChange={this.handleUpload}/>
                <div className="row" style={{position: "fixed", zIndex: 2}}>
                    <div className="col-sm-3">
                        <ButtonToolbar>
                        <ButtonGroup justified>
                            <ButtonGroup>
                                <Button onClick={fileSystemActions.goBack}>
                                    <Glyphicon glyph="arrow-left" />
                                </Button>
                            </ButtonGroup>
                            <ButtonGroup>
                                <Button onClick={fileSystemActions.goForward}>
                                    <Glyphicon glyph="arrow-right" />
                                </Button>
                            </ButtonGroup>
                            <ButtonGroup>
                                <Button bsStyle="primary" onClick={() => this.upload.click()}>
                                    <Glyphicon glyph="export" />
                                </Button>
                            </ButtonGroup>
                            <ButtonGroup>
                                <Button bsStyle="primary" onClick={() => this.refresh(this.state.tree.RootFolder.Name)}>
                                    <Glyphicon glyph="refresh" />
                                </Button>
                            </ButtonGroup>
                        </ButtonGroup>
                        </ButtonToolbar>
                    </div>
                    <div className="col-sm-9">
                        <EntryBox 
                        ref={box => this.box = box}
                        onConfirmation={this.openFolder}
                        defaultValue={tree.RootFolder.Name}
                        glyph="chevron-right" />
                    </div>
                </div>
            <div className="row">
                <div className="col-xs-12">
                    <Table>
                        <thead>
                            <tr>
                                <th></th>
                                <th>Name</th>
                                <th>Size</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tree.RootFolder.ChildFolders.map(folder => {
                                return <tr key={folder.Name}>
                                    <td width="16"><Glyphicon glyph="folder-close"/></td>
                                    <td>
                                        <span
                                        style={{cursor: "pointer"}}
                                        onClick={() => this.openFolder(folder.Name)}>
                                            {lastPathSegment(folder.Name)}
                                        </span>
                                    </td>
                                    <td></td>
                                </tr>
                            })}
                            {tree.RootFolder.Files.map(file => {
                                return <tr key={file.Path}>
                                    <td><Glyphicon glyph="file" /></td>
                                    <td>
                                        <Dropdown text={lastPathSegment(file.Path)} dropStyle={{width: 150}}>
                                            <ListGroup>
                                                <ListGroupItem onClick={() => this.download(file.Path)}><Glyphicon glyph="download"/> &nbsp; Download</ListGroupItem>
                                            </ListGroup>
                                        </Dropdown>
                                        {_.map(this.state.downloads, (v, k) => {
                                            if (v && k == file.Path && !v.complete) {
                                                return <Bar value={ Number(((v.downloaded/v.total) * 100).toFixed(0))}/>
                                            }
                                            else {
                                                return null
                                            }
                                        })}
                                    </td>
                                    <td>{bytesToSize(file.FileSize)}</td>
                                </tr>
                            })}
                        </tbody>
                    </Table>
                </div>
            </div>
        </div>
    }
}

export function FilePage(props: any) {
    return <div className="file-page">
        <FileList />
    </div>
}