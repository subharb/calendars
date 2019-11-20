import React, { Component } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import moment from 'moment';
import { fetchTagsSession } from '../../../../actions';
import { Translate, withLocalize } from 'react-localize-redux';

const Button = styled.button`
    position:relative;
    border:1px solid #959595;
    display:flex;
    justify-content:center;
    width:100%;
    border-radius:4px;
    margin-top:0.2rem;
    background-color:${props => props.selected ? props.theme.color1 : "white"};
    cursor:pointer;
    color:${props => props.selected ? "#FFF" : "#000"};
    border:${props => props.selected ? 'none' : "1px solid #959595"};
`;

const LoadingBall = styled.div`
    position:absolute;
    top:0;
    left:0;
    bottom:0;
    margin:auto;
    opacity: 1.0;
    width: 100%;
    height: 100%;

`;
const OccupancyMeterHolder = styled.div`
    display:flex;
    justify-content:center;
    padding-top: 0.5rem;
    padding-right: 0.5rem;
`;

const OccupancyMeter = styled.div`
    width: 8px;
    height: 8px;                
    border-radius: 2px;   
`;
const TimeHolder = styled.div`

`;

class SessionButton extends Component {
    constructor(props){
        super(props);
        this.state = { loading : false }
        this.occupancyState = ["low_occupancy", "medium_occupancy", "high_occupancy", "no_occupancy"];
    }
    selectedSession(session){ 
        console.log("Sesión seleccionada: ",session);
        console.log("session.extra.tags", session.extra.tags);
        //Compruebo que no tenga etiquetas
        if(session.extra.hasTags){
            //Si ya están las etiquetas del servidor
            if(this.props.tags.dictTags.hasOwnProperty(session.idSession) && Object.keys(this.props.tags.dictTags[session.idSession]).length > 0){
                //Compruebo que hay una etiqueta de sesión
                let sessionTag = false;
                let listTagsSession = this.props.tags.dictTags[session.idSession].tags;
                    for(let i = 0; i < listTagsSession.length; i++){
                        console.log("Tag", listTagsSession[i]);
                        if(listTagsSession[i].level === "session"){
                            sessionTag = listTagsSession[i];
                        }
                    }
                console.log("sessionTag", sessionTag);
                if(sessionTag){
                    //Si hay etiqueta y no ha sido aceptada, la muestro
                    let found = false;
                    if(this.props.tags.accepted.hasOwnProperty(session.idSession)){
                        console.log("tags: ", this.props.tags.accepted[session.idSession]);
                        for(let i = 0; i < this.props.tags.accepted[session.idSession].length; i++){
                            console.log("Tag", this.props.tags.accepted[session.idSession][i]);
                            console.log("Tag", sessionTag);
                            if(this.props.tags.accepted[session.idSession][i] === sessionTag.id){
                                found = true;
                            }
                        }
                    }
                    
                    if(!found){
                        let infoTag = sessionTag;
                        infoTag.idSession = session.idSession;
                        console.log("TagInfo: ",infoTag);
                        this.props.updateModalInfo({"title" : infoTag.title, "description" : infoTag.message, "buttons" : { "accept" : "Aceptar" , "cancel" : "Cancelar"}, "type" : infoTag.type, "extra" : infoTag});  
                        this.session  = session;
                    }
                    else{
                        
                        this.props.updateSession(session);
                        
                    }
                }
                else{
                    this.props.updateSession(session);
                    
                }   
            }
            else{
                //Marco la sesion que hay que actualizar
                this.setState({loading : true});
                //Pido las etiquetas al servidor
                let sessionObj = {};
                sessionObj.idSession = session.idSession;
                sessionObj.idEvent = this.props.idEvent;
                this.props.fetchTagsSession(sessionObj, this.props.translate("code"));
            }
        }
        
        else{
            this.props.updateSession(session);
        }
        //
    }
    shouldComponentUpdate(nextProps, nextState){
        console.log("Ha cambiado props?", !_.isEqual(nextProps, this.props));
        console.log("Ha cambiado state?", !_.isEqual(nextState, this.state));
        console.log("Ha cambiado Tags Props?", !_.isEqual(nextProps.tags.dictTags.hasOwnProperty(this.props.session.idSession), this.props.tags.dictTags.hasOwnProperty(this.props.session.idSession)));
        //Si cambia el state o los tags de esa sesion actualizo
        if(nextProps.selected !== this.props.selected || !_.isEqual(nextState, this.state) || !_.isEqual(nextProps.tags.dictTags.hasOwnProperty(this.props.session.idSession), this.props.tags.dictTags.hasOwnProperty(this.props.session.idSession))){
            return true;
        }
        else{
            return false;
        }
        
    }
    componentDidUpdate(){
        if(this.state.loading && this.props.tags.dictTags.hasOwnProperty(this.props.session.idSession)){
            this.setState({loading : false});
            this.selectedSession(this.props.session);
        }
    }
    render() {
        console.log("REnder de session:", this.props.session.idSession);
        let occupancyClassName = this.occupancyState[0];
        if(this.props.session.percentAvailable < 0.5){
            occupancyClassName = this.occupancyState[1];
            if(this.props.session.percentAvailable < 0.2 ){
                occupancyClassName = this.occupancyState[2];
                if(this.props.session.percentAvailable === 0 ){
                    occupancyClassName = this.occupancyState[3];
                }
            }
        }
        
        
        return (
            <Button disabled={this.props.selected} selected={this.props.selected} className="sessionButton selected" onClick={ (e) => { this.selectedSession(this.props.session) }}>
                <OccupancyMeterHolder>
                    <OccupancyMeter className={occupancyClassName} />
                </OccupancyMeterHolder>
                <TimeHolder>
                    { moment(this.props.session.startSession*1000).format("HH:mm") }
                </TimeHolder>   
                { (this.state.loading && !this.props.tags.dictTags.hasOwnProperty(this.props.session.idSession)) && 
                    <LoadingBall>
                        <img src="/img/loading.gif" height="100%" />
                    </LoadingBall>
                }
            </Button>
        );
    }
}

function mapStateToProps(state){
    return{
        modal : state.modal, 
        tags : state.tags
    }
}
export default withLocalize(connect(mapStateToProps, { fetchTagsSession })(SessionButton));  