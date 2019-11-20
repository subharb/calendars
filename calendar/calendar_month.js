import React, { Component } from 'react';
import { connect } from 'react-redux';
import { updateSelectedSession, resetSections, resetSeats, updateModalInfo, resetModal, fetchTagsSession, resetCalendarSession } from '../../../../actions';
import { getDateString, getSessionsFromDate, calendarConfiguration, scrollToElement } from '../../../../helpers';
import  styled  from 'styled-components';
import moment from 'moment';
import { Translate, withLocalize } from 'react-localize-redux';
import Loading from '../../../../components/loading';

const SessionsContainer = styled.div`
    
    flex-direction: column;        
    background-color:${props => props.theme.color2};
    color:${props => props.theme.secondaryFontColor};
    min-height: calc(100vh - 75px);
    @media (min-width: 720px) {
        margin-left:1rem;
        width:20%;  
        min-height:auto;              
    }              
`;

const DatePlaceHolder = styled.div`
    text-align:center;
    background-color:${props => props.theme.color3};
    padding:0.5rem;
    & > h3 {
        text-transform: capitalize;
        display:inline;
    }
    & > span {
        padding-left:1rem;
    }
    @media (min-width: 720px) {
        padding:1.3rem;
        & > h3 {
            text-transform: capitalize;
            display:block
        }
    } 
`;

const SessionsCore = styled.div`
            display:flex;
            flex-direction: column;  
            padding:0.5rem 1.5rem 1.5rem 1.5rem;
            text-align:center;
            @media (max-width: 320px) {
                padding-top:4rem;
            }  
        `;
class CalendarMonth extends Component{
    constructor(props){
        super(props);
        
        this.session = null;
        
        this.nextMonth = this.nextMonth.bind(this);
        this.prevMonth = this.prevMonth.bind(this);
        this.renderSessions = this.renderSessions.bind(this);
        

        this.state = {currentMonth : null, selectedDate : null, sessionLoading: null, sessionSelected : null}
    }
    nextMonth(){
        console.log("Next month:"+this.state.currentMonth);
        if(!this.state.currentMonth){
            this.setState({currentMonth : moment(this.props.calConf.minDate).add(1, "month")});
        }
        else{
            this.setState({currentMonth : this.state.currentMonth.add(1, "month")});
        }
    }
    prevMonth(){
        console.log("Prev month");
        if(this.state.currentMonth){
            this.setState({currentMonth : this.state.currentMonth.subtract(1, "month")});
        }
    }
    updateSession(session){
        let selectionSession = {};
        selectionSession.currentSession = session;
        selectionSession.previousSession = this.props.calendar.selectedSession;
        this.props.updateSelectedSession(selectionSession);
        
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
                        
                        this.updateSession(session);
                        
                    }
                }
                else{
                    this.updateSession(session);
                    
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
            this.updateSession(session);
        }
        //
    }
    selectDate(date){
        console.log("Fecha seleccionada");
        this.setState({selectedDate : date});
        this.props.resetCalendarSession()
        this.props.resetSections();
        this.props.resetSeats();
        if(typeof this.props.callBackSelectedDate === "function"){
            let diffDays = date.diff(moment().startOf('day'), 'days');
            this.props.callBackSelectedDate(diffDays);
        }
        else{
            const listSessions = getSessionsFromDate(this.props.sessions, date);
            if(listSessions.length === 1){
                this.updateSession(listSessions[0]);
            }

        }
    }
    renderExtraInfo(session){
  
        const SubText = styled.div`
        font-size: 0.7rem;
    `;
        if(session.showAvailableTickets === 1){
            if(session.maxTickets.availableTickets > 0){
                return(
                    <SubText>
                        { session.maxTickets.availableTickets} <Translate id="event.available"></Translate>
                    </SubText>
                    );
            }
            else{
                return (<SubText>
                    <Translate id="event.soldOut"/>
                    </SubText>);
            }
        } 
        else if(session.alterSessionText !== ""){
            return (
            <SubText>
                { session.alterSessionText }
            </SubText>
            );
        }
        return null;  
    }
    renderSessions(){
        console.log(this.state.selectedDate);
        //Si se ha seleccionado una fecha y no está en modo Expo y hay más de una sesión
        if(this.state.selectedDate !== null && typeof this.props.callBackSelectedDate !== "function"){
            const listSessions = getSessionsFromDate(this.props.sessions, this.state.selectedDate);
            //Si hay una sesión no lo muestro
            if(listSessions.length === 1){
                return null;
            }
            const ListSession = styled.ul`
                list-style-type: none;
                padding:0rem;
                margin-bottom:0rem;
                display: flex;
                flex-direction: column;
                flex-wrap: wrap;
                justify-content: space-evenly;
            `;
            const ListElement = styled.li`
                padding-top:0.5rem;
                padding-bottom:0.5rem;
                position:relative;
            `;
            const ListElementLoading = styled(ListElement)`
                transition: all .3s;
                transition-timing-function: ease-in;
                
            `;
            const SessionButton = styled.button`
                padding:0.55rem 1rem 0.55rem 1rem;
                outline: 2px solid white;
                background-color:transparent;   
                color:white;
                border:none;
                &:active {
                    border:1px white solid;
                }
            `;
            const SessionButtonSelected = styled(SessionButton)`
                background-color:white;   
                color:${props => props.theme.color2};
                border:none;
                
            `;
            const SessionButtonLoading = styled(SessionButton)`
                background-color:white;   
                color:${props => props.theme.color2};
                border:none;
                z-index:-100;
                opacity:0.5;
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
            const SessionSoldOut = styled(SessionButton)`
                xbackground-color:red;
                opacity:0.3;
                color:#fff;
                border:none;
            `;
            const Icon = styled.i`
                padding-right:0.55rem;
                vertical-align:top!important;
            `;
           
            console.log("Pintando sesiones");
            
            console.log("Hay "+listSessions.length+" sesiones");
            let htmlSessions =  listSessions.map(session => {
                const sessionMoment = moment(session.startSession*1000);
                //console.log(JSON.stringify(this.props.calendar.selectedSession));
                console.log(session);
                let timeText = session.showTime ? sessionMoment.format("HH:mm") : session.alterSessionText;
                
                if(session.soldOut == 0){
                    if((this.props.calendar.selectedSession) && (this.props.calendar.selectedSession.idSession === session.idSession)){
                        console.log("ES LA SESION");
                        return(
                            <ListElement key={ sessionMoment.format("x") }>
                                <SessionButtonSelected onClick={ (e) => { this.selectedSession(session) }} key={ sessionMoment.format("x") }><Icon className="material-icons">alarm</Icon>{ timeText }{ this.renderExtraInfo(session) }</SessionButtonSelected>
                            </ListElement>
                        );
                    }
                    else if((this.state.sessionLoading == session.idSession) && (!this.props.tags.dictTags.hasOwnProperty(session.idSession))){
                        return(
                            <ListElementLoading key={ sessionMoment.format("x") }>
                                <SessionButtonLoading onClick={ (e) => { this.selectedSession(session) }} key={ sessionMoment.format("x") }><Icon className="material-icons">alarm</Icon>{ timeText }{ this.renderExtraInfo(session) }</SessionButtonLoading>
                                <LoadingBall>
                                    <img src="/img/loading.gif" height="100%" />
                                </LoadingBall>
                            </ListElementLoading>
                        );
                    }
                    else{
                        //El check con hasTags es porque puede decir que hay hastags y luego no haberlos, cambio su estado para qeu actualice y sirva
                        //de condicion para seleccionar la sesion que parecía que tenia tags pero no
                        if((this.state.sessionLoading === session.idSession) && (this.props.tags.dictTags.hasOwnProperty(session.idSession) ||!session.extra.hasTags)){
                            this.setState({sessionLoading : null});
                            this.selectedSession(session);
                        }
                        return(
                            <ListElement key={ sessionMoment.format("x") }>
                                <SessionButton onClick={ (e) => { this.selectedSession(session) }} key={ sessionMoment.format("x") }><Icon className="material-icons">alarm</Icon>{ timeText }{ this.renderExtraInfo(session) }</SessionButton>
                            </ListElement>
                        );
                    }
                }
                else{
                    return(
                        <ListElement key={ sessionMoment.format("x") }>
                            <SessionSoldOut key={ sessionMoment.format("x") } disabled><Icon className="material-icons">alarm</Icon>{ timeText }{ this.renderExtraInfo(session) }</SessionSoldOut>
                        </ListElement>
                    );
                }
            });
            return (      
                <SessionsContainer id="times">
                        <DatePlaceHolder>
                            {moment(this.state.selectedDate).startOf('day').format("dddd")}
                            {getDateString(moment(this.state.selectedDate).startOf('day').format("X"))}
                        </DatePlaceHolder> 
                        <SessionsCore>
                            <ListSession>
                                { htmlSessions }
                            </ListSession>
                        </SessionsCore>
                    </SessionsContainer>  
                    
            );               
        }        
    }
    componentDidUpdate(prevProps, prevState){
        if(prevState.selectedDate != this.state.selectedDate){
            if(window.innerWidth < 1025){
                //Si es las sesiones aparecen en columna
                scrollToElement("times");
            }   
        }
    }
    shouldComponentUpdate(nextProps, nextState){
        if((nextProps.modal.info.hasOwnProperty("extra") && nextProps.modal.info.extra.level === "concesion")){
            return false;
        }
        else{
            return true;
        }
    }
    componentWillUnmount(){
        //this.props.resetCalendarSession();
    }
    componentDidMount(){
        if(this.props.calendar.hasOwnProperty("selectedSession") && this.props.calendar.selectedSession.idEvent === this.props.idEvent){
            this.setState({ selectedDate : moment(this.props.calendar.selectedSession.startSession*1000)});
        } 
    }
    componentWillReceiveProps(nextProps){
        //console.log("PrevProps: "+JSON.stringify(this.props));
        //console.log("nextProps: "+JSON.stringify(nextProps));
        //Para saber qué botón se apretó del modal tengo que mirar la diferencia de los props
        console.log("nextProps.modal",nextProps.modal);
        console.log("nextProps.modal.info.extra", nextProps.modal.info.extra);
        if((nextProps.modal.continue)&&(!nextProps.modal.cancel)){
            if(!_.isEmpty(this.session) && this.session.idSession === nextProps.modal.info.extra.idSession && nextProps.modal.info.extra.level === "session"){
                this.updateSession(this.session);
                this.props.resetModal();
            }
            
        }
    }
    renderArrow(){
        if(this.props.small){
            const ArrowHolder = styled.div`
                display:flex;
                justify-content:center;
                
                @media (min-width: 720px) {
                    justify-content:flex-end;
                    padding-right: 1rem;
                }
            `;
            const SvgArrow = styled.polygon`
                fill:#FFF;
                stroke:black;
                xstroke-width:1
            `;
            return(
                <ArrowHolder>
                    <svg height="15" width="60">
                        <SvgArrow points="0,15 60,15 30,0"  />
                    </svg>
                </ArrowHolder>
            );
        }
        
    }
    render(){
        //console.log(JSON.stringify(this.props.disabledDates));
        console.log("%c Render Calendar", 'background: #222; color: #bada55');
        console.log(this.props.test);
        console.log(this.state.hasOwnProperty("selectedDate"));
        const Calendar = styled.div`    
            justify-content: center;
            background-color:white;
            @media (min-width: 720px) {
                ${({ small }) => !small && `
                    width: 100%;
                `}
                
                padding:${props => props.small ? '0rem' : '3rem'};
            }
            @media (min-width: 1025px) {
                padding:${props => props.small ? '0rem' : '6rem'};
            }
           
        `;
        const Container = styled.div`
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            @media (min-width: 720px) {
                width:100%;
                flex-direction: row;
            }
        `;
        const CalendarContainer = styled.div`
            display: inline-flex;
            flex-direction: row; 
            justify-content: center;
            background-color:${props => props.small ? '#fff' : '#F8F8FA'};
            ${({ small }) => small && `
                border: 1px #000 solid;
            `}
            
            padding:1rem;
            width:100%;
            @media (min-width: 720px) {
                width:${props => props.small ? '100%' : '75%'};
                padding:${props => props.small ? '1rem' : '3rem'};
            }
        `;
        const CoreCalendar = styled.div`
            display: inline-flex;
            flex-direction: column; 
            margin: 0 auto;
            width:100%;
        `;
        
        const WeekDaysHeader = styled.div`
            display:inline-flex;
            flex-direction: row;
        `;
        const HeaderCalendar = styled.div`
            font-size:1.25rem;
            padding:0rem 1.3rem 0rem 1.3rem;
            color:${props => this.props.small ? "#000" : props.theme.color3};
            display:inline-flex;
            flex-direction:row;
            justify-content:space-between;
            align-items:center;
        `;
        const MonthSelector = styled.button`
            color:${props => this.props.small ? "#000" : props.theme.color3};
            height:3rem;
            border:none;
            padding:0;
            background-color:transparent;
            &:disabled{
                opacity:0.3;
            }
        `;
        const IconSelect = styled.i`
            font-size:2.5rem;
        `;
        const DayContainer = styled.div`
            display: flex;
            cursor:pointer;
            justify-content:center;
            flex: 0.8;
        `;
        const DayCore = styled.div`
            display:flex;
            justify-content: center;
            align-items: center;
            width:2.5rem;
            height:2.5rem;
            @media (min-width: 1025px) {
                width:4.5rem;
                height:4.5rem;
            } 
        `;
        const EmptyDay = styled(DayCore)`
            background:none;
            border:none;
        `;
        const MiniSessionContainer = styled.div`
            display:flex;
            justify-content:space-around;
            flex-direction: column;    
            align-items:space-aorund;
            padding-bottom:0.4rem;
        `;
        const MiniSession = styled.div`
            margin-top:0.2rem;
            font-size:0.7rem;
            padding:0 0.4rem 0 0.4rem;
        `;
        const MiniSessionDisabled = styled(MiniSession)`
            font-size:1rem;
            
        `;
        const MiniSessionActive = styled(MiniSession)`
            border-radius:100px;
            color:#fff;
            background-color:red;
        `;
        const DisabledDay = styled(DayCore)`
            color:#D3D3D3;
            cursor:default;
        `;
        const SelectedDay = styled(DayCore)`
            outline: 2px solid ${props => props.theme.color2};           
        `;
        const WeekDay = styled(DayCore)`
            color:${props => this.props.small ? "#000" : props.theme.color3};
            cursor:default;
        `;
        const WeeksContainer = styled.div`
            display: inline-flex;
            flex-direction: column;            
        `;
        const WeekContainer = styled.div`
            display:inline-flex;
            flex-direction: row;
        `;
        let momentObj = null;
        //console.log("CALENADAR:"+JSON.stringify(this.props.calendar));
        if(this.state.selectedDate === null){
            console.log("MINDATE:", this.props.calConf.minDate)
            momentObj = moment(this.props.calConf.minDate);
            
        }
        else{
            momentObj = this.state.selectedDate;
        }
        if(this.state.currentMonth){
            momentObj = this.state.currentMonth;
        }
        //console.log("momentObj", this.props.calendar.selectedDate);
        const firstDayMonth = moment([momentObj.format("YYYY"), parseInt(momentObj.format("M MM"))-1, 1]);
        const monthString = momentObj.format('MMMM') +" "+ momentObj.format('YYYY');
        
        const lastDayMonth = moment(firstDayMonth).endOf("month");
        const firstWeekday = parseInt(firstDayMonth.format("e"));
        const offSetDays = (6 - parseInt(lastDayMonth.format("e")));
        
        const diffDates = lastDayMonth.diff(firstDayMonth, 'days') + 1;
        let calendarHTML = [];
        let weekContainer = [];
        let weekIndex = 0;
        for(let i = 0; i < (diffDates + firstWeekday + offSetDays); i++){
            const currentDate = moment([momentObj.format("YYYY"), parseInt(momentObj.format("M MM"))-1, (i -firstWeekday)+ 1]);
            let currentElement;
            let currentContainer;
            if((i >= firstWeekday)&&(i < (diffDates + firstWeekday))){
                if(this.props.calConf.disabledDates.indexOf(currentDate.format("X")) > -1 || (currentDate.startOf('day') < moment(this.props.calConf.minDate).startOf('day')) || (currentDate.startOf('day') > moment(this.props.calConf.maxDate).startOf('day'))) {
                    currentElement = <DisabledDay className="disabledDay" key={i}>{ (i -firstWeekday)+ 1 }</DisabledDay>;    
                }
                else{
                    //let sessions = <MiniSessionContainer><MiniSessionActive>18:00h</MiniSessionActive><MiniSessionActive>19:00h</MiniSessionActive></MiniSessionContainer>
                    if(currentDate.startOf('day').format("X") == moment(this.state.selectedDate).startOf('day').format("X")){
                        console.log("selected: "+currentDate+" i:"+i);
                        currentElement = <SelectedDay className="selectedDay" key={i} onClick={ () => this.selectDate(currentDate) } >{ (i -firstWeekday)+ 1 }</SelectedDay>;
                    }
                    else{
                        currentElement = <DayCore className="dayCore" key={i} onClick={ () => this.selectDate(currentDate) } >{ (i -firstWeekday)+ 1 }</DayCore>;
                    }                 
                }                
            }
            else{
                currentElement = <EmptyDay className="emptyDay" key={i} ></EmptyDay>;    
            }   

            currentContainer =  <DayContainer className="dayContainer" key={i} >{ currentElement }</DayContainer>;    
            
            if(i % 7 == 0 && i !== 0){
                calendarHTML[weekIndex] = <WeekContainer key={ weekIndex }>{ weekContainer }</WeekContainer>  ;
                weekIndex++;
                weekContainer = [];//Necesito asignar otra dirección de memoria.
            }

            weekContainer[i % 7] = currentContainer;     
        }
        calendarHTML[weekIndex] = <WeekContainer key={ weekIndex }>{ weekContainer }</WeekContainer>  ;
        return(
            <Calendar id="calendar" small={this.props.small} >
                { this.renderArrow() }
                <Container>
                    <CalendarContainer small={this.props.small} id="calendar_container">
                        <CoreCalendar id="core_calendar">
                            <HeaderCalendar id="header">
                                <MonthSelector onClick={ this.prevMonth } disabled={momentObj.format("M MM") ===  moment(this.props.calConf.minDate).format("M MM") }>
                                    <IconSelect className="material-icons align-middle">keyboard_arrow_left</IconSelect>
                                </MonthSelector>
                                    { monthString }
                                <MonthSelector onClick={ this.nextMonth } disabled={momentObj.format("M MM") ===  moment(this.props.calConf.maxDate).format("M MM") }>
                                    <IconSelect className="material-icons align-middle">keyboard_arrow_right</IconSelect>
                                </MonthSelector>
                            </HeaderCalendar>
                            <WeekDaysHeader>
                                <DayContainer className="dayContainer">
                                    <WeekDay className="weekDay">L</WeekDay>
                                </DayContainer>
                                <DayContainer className="dayContainer">
                                    <WeekDay className="weekDay">M</WeekDay>
                                </DayContainer>
                                <DayContainer className="dayContainer">
                                    <WeekDay className="weekDay">X</WeekDay>
                                </DayContainer>
                                <DayContainer className="dayContainer">
                                    <WeekDay className="weekDay">J</WeekDay>
                                </DayContainer>
                                <DayContainer className="dayContainer">
                                    <WeekDay className="weekDay">V</WeekDay>
                                </DayContainer>
                                <DayContainer className="dayContainer">
                                    <WeekDay className="weekDay">S</WeekDay>
                                </DayContainer>
                                <DayContainer className="dayContainer">
                                    <WeekDay className="weekDay">D</WeekDay>
                                </DayContainer>
                            </WeekDaysHeader>
                            <WeeksContainer className="weeksContainer">
                                { calendarHTML}
                            </WeeksContainer>
                        </CoreCalendar>
                    </CalendarContainer>
                    { this.renderSessions() }   
                </Container>
            </Calendar>
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

export default withLocalize(connect(mapStateToProps, { resetCalendarSession, updateSelectedSession, resetSections, resetSeats, updateModalInfo, resetModal, fetchTagsSession })(CalendarMonth));  