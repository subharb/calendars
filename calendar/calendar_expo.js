import React, { Component } from 'react';
import { connect } from 'react-redux';
import CalendarMonth from './calendar_month';
import styled from 'styled-components';
import { Translate, withLocalize } from 'react-localize-redux';
import HeaderSection from '../../../../components/header_section';
import { updateSelectedSession, updateSelectedDate, resetSections, resetSeats, updateModalInfo, resetModal, fetchTagsSession, resetCalendarSession } from '../../../../actions';
import { getSessionsFromDate, filterSessionsByTime, scrollToElement } from '../../../../helpers'; 
import moment from 'moment';
import Container from '../../container';
import {isMobile} from 'react-device-detect';

const CalendarContainer = styled.div`
    width:100%;
    
    display:flex;
    flex-direction:column;
    justify-content:center;
`;

const Header = styled.div`
    display:flex;
    justify-content:center;
    padding-bottom:0.5rem;
    padding-top:2rem;
    
`;
const ButtonContainer = styled.div`
    
    justify-content: center;
    display: flex;
    flex-direction:column
    @media (min-width: 720px) {
        flex-direction:row;
        justify-content: space-around;
        width:40rem;
    }
`;

const ButtonDate = styled.button`
    background-color:${props => props.selected ? props.theme.color1 : "#ffffff"};
    color: ${props => props.selected ? "#ffffff" : "#707070"};
	border:1px solid ${props => props.selected ? props.theme.color1 : "#707070"};
	display:inline-block;
	cursor:pointer;
	width:13rem;
	font-size: 1rem;
	text-decoration:none;
    padding: .85rem 1.75rem .85rem 1.75rem;
    margin-top:1rem;
    text-transform:uppercase;
    @media (min-width: 720px) {
        
        margin-top:0rem;
    }
    
`;
const SvgHolder = styled.div`
    display:inline-block;
`;
const SessionsTimeContainer = styled.div`
    display:flex;
    justify-content:center;
    padding-bottom:2rem;
    flex-direction: column;
`;
const SessionsTime = styled.div`
    display:flex;
    justify-content:center;
`;
const SessionsTimeHolder = styled.div`
    display:flex;
    justify-content:center;
    width: 60rem;
    flex-wrap: wrap;
`;
const SessionTime = styled.button`
    position:relative;
    width:7.6rem;
    background-color:${props => props.selected ? props.theme.color1 : "#ffffff"};
    color: ${props => props.selected ? "#ffffff" : "#707070"};
    border:1px solid ${props => props.selected ? props.theme.color1 : "#707070"};
    padding: .85rem 1.75rem .85rem 1.75rem;
    margin-left:0.5rem;
    margin-left:0.5rem;
    margin-top:1rem;
    cursor:pointer;
    text-align: center;
    &:disabled{
        cursor:not-allowed;
    }
`;
const OccupancyMeterHolder = styled.div`
    display:flex;
    justify-content:center;
`;

const OccupancyMeter = styled.div`
    width: 8px;
    height: 8px;                
    border-radius: 4px;   
`;

const CalendarContainerMonth = styled.div`
    display:flex;
    justify-content:center;
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
    display:${props=>props.show ? 'block' : 'none'};
    
`;
const ColorCaptionContainer = styled.div`
    display: flex;
    justify-content: center;
    
    padding: 1rem;
    @media (min-width: 720px) {
        padding-top:2rem;
    }
`;
const ColorCaptionFrame = styled.div`
    display: flex;
    padding: 0.5rem 1rem 0.5rem 0.5rem;
    border:1px #707070 solid;
    flex-wrap: wrap;
`;
const Caption = styled.div`
    display:flex;
    align-items: center;
    padding-left:1rem;
`;
const TextHolder = styled.div`
    padding-left:0.5rem;
    color:#707070;
`;

const initialState = {itemSelected : null, turn : null, showCalendar : false, sessionLoading : null}
class CalendarExpo extends Component {
    constructor(props){
        super(props);
        this.selectDate = this.selectDate.bind(this);
        this.daysButtons = ["calendar.dates.today", "calendar.dates.tomorrow", "calendar.dates.otherDates"];
        this.turnsSchedule = ["12:00", "16:00"];
        this.turnIcons = ["amanecer", "mediodia", "noche"];
        this.occupancyState = ["low_occupancy", "medium_occupancy", "high_occupancy", "no_occupancy"];
        this.state = initialState;
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
                        let selectionSession = {};
                        selectionSession.currentSession = session;
                        selectionSession.previousSession = this.props.calendar.selectedSession;
                        this.props.updateSelectedSession(selectionSession);
                        scrollToElement("sessions_unnumbered");
                    }
                }
                else{
                    let selectionSession = {};
                    selectionSession.currentSession = session;
                    selectionSession.previousSession = this.props.calendar.selectedSession;
                    this.props.updateSelectedSession(selectionSession);
                    scrollToElement("sessions_unnumbered");
                }   
            }
            else{
                //Marco la sesion que hay que actualizar
                this.setState({sessionLoading : session.idSession});
                //Pido las etiquetas al servidor
                let sessionObj = {};
                sessionObj.idSession = session.idSession;
                sessionObj.idEvent = this.props.idEvent;
                this.props.fetchTagsSession(sessionObj, this.props.translate("code"));
            }
        }
        
        else{
            let selectionSession = {};
            selectionSession.currentSession = session;
            selectionSession.previousSession = this.props.calendar.selectedSession;
            this.props.updateSelectedSession(selectionSession);
            scrollToElement("sessions_unnumbered");
        }
        //
    }
    
    renderSessionsTurn(listSessions){
        let sessionsTime = []
        if(this.state.turn !== null){
            let selectedDate = moment().add(this.state.itemSelected, 'days');
            let sessionByTime = filterSessionsByTime(selectedDate, this.state.turn[0], this.state.turn[1], listSessions);

            sessionsTime = sessionByTime.map(session => {
                let occupancyClassName = this.occupancyState[0];
                if(session.percentAvailable < 0.5){
                    occupancyClassName = this.occupancyState[1];
                    if(session.percentAvailable < 0.2 ){
                        occupancyClassName = this.occupancyState[2];
                        if(session.percentAvailable === 0 ){
                            occupancyClassName = this.occupancyState[3];
                        }
                    }
                }
                let showLoading = false;
                if((this.state.sessionLoading === session.idSession) && (this.props.tags.dictTags.hasOwnProperty(session.idSession) ||!session.extra.hasTags)){
                    this.setState({sessionLoading : null});
                    this.selectedSession(session);
                }
                else if(this.state.sessionLoading === session.idSession){
                    showLoading = true;
                }
                return(
                    <SessionTime disabled={session.percentAvailable === 0} className="session_time" loading={showLoading} onClick={ () => this.selectedSession(session)} selected={  this.props.calendar.hasOwnProperty("selectedSession") && this.props.calendar.selectedSession.idSession === session.idSession}>   
                        { moment(session.startSession*1000).format("HH:mm") }
                        <LoadingBall show={showLoading}>
                            <img src="/img/loading.gif" height="100%" />
                        </LoadingBall>
                        <OccupancyMeterHolder>
                            <OccupancyMeter className={occupancyClassName} />
                        </OccupancyMeterHolder>
                    </SessionTime>
                );
            });
            let listCaptions = [];
            for(let i = 0; i< this.occupancyState.length; i++){
                let translateKey = "calendar.occupancy.";
                listCaptions.push(
                    <Caption>
                        <OccupancyMeterHolder>
                            <OccupancyMeter className={this.occupancyState[i]} />
                        </OccupancyMeterHolder>
                        <TextHolder>
                            { this.props.translate(translateKey+this.occupancyState[i])}
                        </TextHolder>
                    </Caption>)
            }
            let colorCaption = <ColorCaptionContainer>
                                    <ColorCaptionFrame>
                                        {listCaptions}
                                    </ColorCaptionFrame>
                                </ColorCaptionContainer>
            if(!isMobile){
                return(
                    <SessionsTimeContainer id="sessions_time" className="sessions_time_container">
                        <SessionsTime>
                            <SessionsTimeHolder className="sessions_time_holder" >
                                { sessionsTime }
                            </SessionsTimeHolder>
                        </SessionsTime>
                        { colorCaption }
                    </SessionsTimeContainer>
                );
            }
            else{
                return ([
                    <Container>
                        <HeaderSection show={true} id="sessions_time" iconType = "clock" ref={ (separatorRef) => this.separatorRef = separatorRef}>
                            <Translate id="event.chooseTime" />
                        </HeaderSection>
                        <SessionsTimeContainer id="sessions_time" className="sessions_time_container">
                            <SessionsTime>
                                <SessionsTimeHolder className="sessions_time_holder" >
                                    { sessionsTime }
                                </SessionsTimeHolder>
                            </SessionsTime>
                            { colorCaption }
                        </SessionsTimeContainer>
                    </Container>,
                    <div id="sessions_unnumbered"></div>
                ]
                );
            
            }
        }
        else{
            return(<div id="sessions_time"></div>);
        }
        
        
    }
    selectTurn(turn){
        if(this.state.turn !== turn){
            scrollToElement("sessions_time");
            this.props.resetCalendarSession();
            this.setState({turn : turn});
        }
    }
    renderSessionsDate(){
        if(this.state.itemSelected !== null){
            let selectedDate = moment().add(this.state.itemSelected, 'days');
            const listSessions = getSessionsFromDate(this.props.sessions, selectedDate);
            //Pinto 3 turnos
            let firstSession = moment(listSessions[0].startSession*1000)
            let lastSession = moment(listSessions[listSessions.length-1].startSession*1000).add(listSessions[listSessions.length-1].duration, "minutes");

            let tempTurnsSchedule = this.turnsSchedule.slice();
            tempTurnsSchedule.unshift(firstSession.format("HH:mm"));
            tempTurnsSchedule.push(lastSession.format("HH:mm"));

            let arrayButtons = [];
            for(let i = 1; i < tempTurnsSchedule.length; i++){
                let sessionByTime = filterSessionsByTime(selectedDate, tempTurnsSchedule[i-1], tempTurnsSchedule[i], listSessions);

                if(sessionByTime.length > 0){
                    let isSelected = _.isEqual(this.state.turn,[tempTurnsSchedule[i-1], tempTurnsSchedule[i]]);
                    let theme = isSelected? "" : "-dark";
                    let urlSvg = "/img/calendar/"+this.turnIcons[i-1]+theme+".svg";
                    arrayButtons.push(
                        <ButtonDate className="button_date" selected={isSelected} 
                            onClick={ () => this.selectTurn([tempTurnsSchedule[i-1], tempTurnsSchedule[i]]) }>
                                <SvgHolder>
                                    <img src={urlSvg} height="26px" />
                                </SvgHolder><span>{tempTurnsSchedule[i-1]} - {tempTurnsSchedule[i]}</span></ButtonDate >)
                }   
            }
            
                return([
                    <Header className="header_buttons">
                        <ButtonContainer className="button_container">
                            { arrayButtons }
                        </ButtonContainer>
                    </Header>,
                    
                    this.renderSessionsTurn(listSessions)
                    ]
                );
            
        }
        else{
            return null;
        }
    }
    
    renderSessions(){
        if(this.state.itemSelected !== null){
                let nameSection = (isMobile) ? "event.chooseTurn" : "event.chooseTime"
                return([
                    <Container>
                        <HeaderSection show={true} id="separatorTurns" iconType = "clock" ref={ (separatorRef) => this.separatorRef = separatorRef}>
                            <Translate id={nameSection} />
                        </HeaderSection>
                        { this.renderSessionsDate() } 
                    </Container>
                ]);
            
        }
        else{
            return null;
        }
        
    }
    selectDate(itemSelected){
        if(this.state.itemSelected !== itemSelected){
            scrollToElement("separatorTurns");
            this.props.resetCalendarSession();
            let tempState = {...initialState};
            tempState.itemSelected = itemSelected
            this.setState(tempState);            
        }
    }
    renderCalendar(){
        
        if(this.state.showCalendar){
            return( 
                <CalendarContainerMonth>
                    <CalendarMonth callBackSelectedDate={ this.selectDate } small calConf={this.calConf} {...this.props } />
                </CalendarContainerMonth>);
        }
        else{
            return null;
        }
    }
    showCalendar(){
        let tempState = {...initialState};
        tempState.showCalendar = !this.state.showCalendar;
        this.setState(tempState);  
    }
    componentWillReceiveProps(nextProps){
        //console.log("PrevProps: "+JSON.stringify(this.props));
        //console.log("nextProps: "+JSON.stringify(nextProps));
        //Para saber qué botón se apretó del modal tengo que mirar la diferencia de los props
        console.log("nextProps.modal",nextProps.modal);
        console.log("nextProps.modal.info.extra", nextProps.modal.info.extra);
        if((nextProps.modal.continue)&&(!nextProps.modal.cancel)){
            if(!_.isEmpty(this.session) && this.session.idSession === nextProps.modal.info.extra.idSession && nextProps.modal.info.extra.level === "session"){
                let selectionSession = {};
                selectionSession.currentSession = this.session;
                selectionSession.previousSession = this.props.calendar.selectedSession;
                this.props.updateSelectedSession(selectionSession);
                this.props.resetModal();
            }    
        }
    }
    render() {
        //Comprobar que hay fechas para mañana y otras fechas. Para mostrar o no los botones
        console.log("%c Render Calendar Expo", 'background: #222; color: #bada55');
        let buttonsDaysArray = [];
        for(let i = 0; i < 2; i++){
            let selectedDate = moment().add(i, 'days');
            const listSessions = getSessionsFromDate(this.props.sessions, selectedDate);
            if(listSessions.length > 0 || (i ==2 && Object.values(this.props.sessions).length > 0)){
                buttonsDaysArray.push(<ButtonDate className="button_date" selected={this.state.itemSelected === i} onClick={ () => this.selectDate(i) }>{ this.props.translate(this.daysButtons[i]) }</ButtonDate >);
            }
        }
        buttonsDaysArray.push(<ButtonDate className="button_date" selected={ this.state.itemSelected > 1 } onClick={ () => this.showCalendar() }>{ this.props.translate(this.daysButtons[2]) }</ButtonDate >);
        return (
            <CalendarContainer id="calendar_expo">
                <Header className="header">
                    <ButtonContainer className="buttons_container">
                        { buttonsDaysArray }
                    </ButtonContainer>
                </Header>
                { this.renderCalendar() }
                <div style={{ paddingTop: '2rem'}}>
                    { this.renderSessions() }
                </div>
                <div id="separatorTurns"></div>
            </CalendarContainer>
        );
    }
}

function mapStateToProps(state){
    return{
        calendar : state.calendar,
        modal : state.modal, 
        tags : state.tags
    }
}

export default withLocalize(connect(mapStateToProps, { resetCalendarSession, updateSelectedSession, updateSelectedDate, resetSections, resetSeats, updateModalInfo, resetModal, fetchTagsSession })(CalendarExpo));  