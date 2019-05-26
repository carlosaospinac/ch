import React from "react";
export class Screen extends React.Component {
    render() {
        return (
            <div>
                <div className="laptop-wrapper">
                    <div className="laptop">
                        <div className="upper">
                            <div className="content">
                                {this.props.children}
                            </div>
                        </div>
                        <div className="lower"></div>
                    </div>
                </div>
            </div>
        );
    }
}
