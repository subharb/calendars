import React, { Component } from 'react';
import { connect } from 'react-redux';
import { fetchTagsSession, updateSelectedSession, updateSelectedDate, resetSections, resetSeats, updateModalInfo, resetModal } from '../../../../actions';
import { getDateString, getSessionsFromDate, calendarConfiguration } from '../../../../helpers';
import  styled  from 'styled-components';
import moment from 'moment';
import _ from 'lodash';
import SessionButton from './session_button';
import { Translate, withLocalize } from 'react-localize-redux';
//import * as Scroll from 'react-scroll';
import Config from '../../../../reducers/config.json';

    const isMobile = window.innerWidth <= 500;
    const Calendar = styled.div`   
        width:100%;
        xheight:100px;
        width:${props => props.width};    
        @media (min-width: 720px) {
            
        }
    `;
    const MonthContainer = styled.div`
        display:flex; 
        width:100%;
        background-color:white;
        height:3rem;
        justify-content:space-between;
    `;
    const MonthSelector = styled.div`
        
    `;
    const MonthHolder = styled.div`
        font-size:1.4rem;
        color:#5C5C5C;
    `;
    const IconSelect = styled.i`
        font-size:2.5rem;
        cursor:${props => props.disabled ? "auto" : "pointer"};
        opacity:${props => props.disabled ? "0.3" : "1.0"};
        
    `;
    const WeekDayContainer = styled.div`
        display:flex;
        flex-wrap:wrap;
        padding-top:0.5rem;
        color:#8F8F8F;
        font-size:1.2rem;
    `;
    const DayContainer = styled.div`
        width:14.28%;
        height:6rem;
        text-align:center;
        
    `;
    const SelectedDay = styled(DayContainer)`
        outline: 2px solid ${props => props.theme.color2};           
    `;
    const DisabledDay = styled(DayContainer)`
        color:#D3D3D3;
        cursor:default;
    `;
    const WeekDayHolder = styled(DayContainer)`
        display:flex;
        justify-content:center;
        height:2.5rem;
    `;
    const CoreCalendar = styled.div`
        display: flex;
        flex-wrap: nowrap;
        overflow: auto;
        -ms-overflow-style: none;  // IE 10+
        scrollbar-width: none; 
        -webkit-overflow-scrolling: touch;
        -ms-overflow-style: -ms-autohiding-scrollbar;
    `;
    const MonthDayContainer = styled.div`
        display:flex;
        flex-wrap:wrap;
        width:${props => props.width};           
    `;
    const ScrollCalendar = styled.div`
        display: flex;
        flex-wrap: nowrap; 
    `;
    const MonthItem = styled.div`
        display:inline-block;
    `;
    
    const DayMonthHolder = styled.div`
        display:flex;
        justify-content:space-around;
        flex-direction: column;    
    `;
    const SessionsContainer = styled.div`
        padding:0.2rem;
    `;
    

class CalendarEndless extends Component{
    constructor(props){
        super(props);
        this.currentMonth = 0;
        this.widthCalendar= 0;
        this.timer = null;
        this.currentOffset = 0;
        this.direction = "right";
        this.refPrevMonth = React.createRef();
        this.refNextMonth = React.createRef();
        this.refScrollCalendar = React.createRef();
        this.refMonthItem = React.createRef();
        this.refStringCurrentMonth = React.createRef();
        this.currentScroll = 0;
        this.arrayMonthItems = [];
        this.arrayObjMonths = [];
        this.session = null;
        this.nextMonth = this.nextMonth.bind(this);
        this.prevMonth = this.prevMonth.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        // this.renderSessions = this.renderSessions.bind(this);
        // this.selectSession = this.selectSession.bind(this);
        this.occupancyState = ["low_occupancy", "medium_occupancy", "high_occupancy", "no_occupancy"];
        this.state = { sessionLoading: null}
        this.calConf = calendarConfiguration(this.props.sessions);
    }
    scrollToCurrentMonth(){
        console.log("Hacemos scroll a ", this.currentMonth);
        //  let monthToShow = $('.monthItem:eq('+this.currentMonth+')');
        // console.log("Hacemos scroll", monthToShow.offset().left);
        // $('.core_calendar').animate({
        //     scrollLeft: monthToShow.offset().left
        // }, 100); 
        this.arrayMonthItems[this.currentMonth].scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'start' })
        this.refStringCurrentMonth.current.innerHTML = this.arrayObjMonths[this.currentMonth].format('MMMM YYYY');
        this.currentScroll = this.refScrollCalendar.current.scrollLeft;
        //this.refScrollCalendar.current.addEventListener("scroll", this.handleScroll, true );
    }
    
    prevMonth(){
        console.log("prevMonth");
        if(this.currentMonth > 0){
            this.currentMonth--;
            this.scrollToCurrentMonth();
        }
        if(this.currentMonth === 0){
            this.refPrevMonth.current.style.opacity = 0.3;
            this.refPrevMonth.current.style.cursor = "auto";
        }
        this.refNextMonth.current.style.opacity = 1.0;
        this.refNextMonth.current.style.cursor = "pointer";
    }
    nextMonth(){
        console.log("nextMonth");
        if((this.currentMonth + 1) < this.arrayMonthItems.length){
            this.currentMonth++;
            this.scrollToCurrentMonth();
        }
        if(this.currentMonth +1 === this.arrayMonthItems.length){
            this.refNextMonth.current.style.opacity = 0.3;
            this.refNextMonth.current.style.cursor = "auto";
        }
        this.refPrevMonth.current.style.opacity = 1.0;
        this.refPrevMonth.current.style.cursor = "pointer";
    }
    updateSession(session){
        let selectionSession = {};
        selectionSession.currentSession = session;
        selectionSession.previousSession = this.props.calendar.selectedSession;
        this.props.updateSelectedSession(selectionSession);
    }
   
    shouldComponentUpdate(nextProps, nextState){
        if((nextProps.modal.continue)&&(!nextProps.modal.cancel)){
            if(!_.isEmpty(this.session) && this.session.idSession === nextProps.modal.info.extra.idSession && nextProps.modal.info.extra.level === "session"){
                this.props.updateSelectedSession(this.session);
                this.props.resetModal();
            }
        }
        if(nextProps.modal.info.hasOwnProperty("extra") && nextProps.modal.info.extra.level === "concesion"){
            return false;
        }
        else{
            return true;
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
    handleScroll(event){
        console.log("SCroll", (this.refScrollCalendar.current.scrollLeft/parseInt(this.widthCalendar))%1);
        
        this.direction = (this.refScrollCalendar.current.scrollLeft >= this.currentOffset) ? "right" : "left";

        if(this.timer !== null) {
            clearTimeout(this.timer);        
        }

        if(this.refScrollCalendar.current.scrollLeft !== this.currentOffset){
            this.timer = setTimeout(function() {
                console.log("FIN SCROLL", this.widthCalendar);
                let monthScrolled = (this.refScrollCalendar.current.scrollLeft/parseInt(this.widthCalendar))%1;
                console.log("Direction", this.direction);
                if(((monthScrolled < 0.15) && (monthScrolled >= 0)) || (monthScrolled > 0.85)){
                    this.scrollToCurrentMonth();
                }
                else if(this.direction === "right"){
                    this.nextMonth();
                }
                else{
                    this.prevMonth();
                }
            }
            .bind(this),
            150);
        }    
        this.currentOffset = this.refScrollCalendar.current.scrollLeft;

    }
    test(event){
            // Stuff
            console.log("SHI!T", event.data);
            
            
            let monthsScrolled = $(this).scrollLeft()/parseInt(event.data.widthCalendar);
            console.log("HAY SCROLLLL", monthsScrolled);
            if(((monthsScrolled%1) > 0.25)){
                console.log("SE PASÖ!");
                $(".core_calendar").off('scroll');
                event.data.nextMonth();
            }
         
    }
    componentDidMount(){
        let that = this;
        //$(".core_calendar").on('scroll', that , this.test);
        this.arrayMonthItems = document.getElementsByClassName("monthItem"); 
        //this.refScrollCalendar.current.addEventListener("scroll", this.handleScroll, true );
    }
    // getSnapshotBeforeUpdate(prevProps, prevState) {
    //     // Are we adding new items to the list?
    //     // Capture the scroll position so we can adjust scroll later.
        
    //         //console.log("prevProps", prevProps);
        
    //         const refScrollCalendar = this.refScrollCalendar.current;
    //         return refScrollCalendar.scrollLeft;
        
                   
    // }
    // componentDidUpdate(prevProps, prevState, snapshot) {
    //     // If we have a snapshot value, we've just added new items.
    //     // Adjust scroll so these new items don't push the old ones out of view.
    //     // (snapshot here is the value returned from getSnapshotBeforeUpdate)
    //     // console.log("snapshot", snapshot);
    //     // if (snapshot !== null) {
    //     //   const refScrollCalendar = this.refScrollCalendar.current;
    //     //   refScrollCalendar.scrollLeft = snapshot;
    //     // }
    //     console.log("Has Props changed?", _.isEqual(this.props, prevProps));
    //     console.log("Has State changed?", _.isEqual(this.state, prevState))
    //     if(this.refScrollCalendar.current){
    //         this.refScrollCalendar.current.scrollLeft = this.currentScroll; 
    //     }
    //   }
    render(){
        console.log("%c Render Calendar Endless", 'background: #222; color: #bada55');
        console.log(this.calConf);
        
        //Genera el calendario de un mes
        let momentObj = moment(this.calConf.minDate);
        
        const monthString = momentObj.format('MMMM') +" "+ momentObj.format('YYYY');
        
        let calendarHTML = [];
        let weekContainer = [];
        let minDateMonth = moment(this.calConf.minDate).format("M");
        let maxDateMonth = moment(this.calConf.maxDate).format("M");

        const numberMonths = (maxDateMonth - minDateMonth) + 1;
        let arrayMonthItemsHTML = [];
        
        //No es posible coger el ancho del abuelo, poruqe aun no se ha montado
        //Cojo el ancho de la ventana `porque en realidad debería ser el 100% de ancho.
        this.widthCalendar =  document.documentElement.clientWidth < 1025 ? document.documentElement.clientWidth : ((document.documentElement.clientWidth/2)-15)+"px";

        for(let j = 0; j < numberMonths; j++){
            
            let currentMonthObj = momentObj.clone();
            this.arrayObjMonths.push(currentMonthObj);
            let datesMonthItem = [];
            const firstDayMonth = moment([momentObj.format("YYYY"), parseInt(momentObj.format("M MM"))-1, 1]);
            const firstWeekday = parseInt(firstDayMonth.format("e"));
            const lastDayMonth = moment(firstDayMonth).endOf("month");
            const offSetDays = (6 - parseInt(lastDayMonth.format("e")));            
            const diffDates = lastDayMonth.diff(firstDayMonth, 'days') + 1;
            const numberBoxesCalendar = diffDates + firstWeekday + offSetDays;
            for(let i = 0; i < numberBoxesCalendar; i++){
                const currentDate = moment([momentObj.format("YYYY"), parseInt(momentObj.format("M MM"))-1, (i -firstWeekday)+ 1]);
                let currentElement;
                let currentContainer;
                if((i >= firstWeekday)&&(i < (diffDates + firstWeekday))){
                    if(this.calConf.disabledDates.indexOf(currentDate.format("X")) > -1 || (currentDate.startOf('day') < moment(this.calConf.minDate).startOf('day')) || (currentDate.startOf('day') > moment(this.calConf.maxDate).startOf('day'))) {
                        currentElement = <DisabledDay className="disabledDay" key={i}>{ (i -firstWeekday)+ 1 }</DisabledDay>;    
                    }
                    else{
                        //let sessions = <MiniSessionContainer><MiniSessionActive>18:00h</MiniSessionActive><MiniSessionActive>19:00h</MiniSessionActive></MiniSessionContainer>
                        
                        const listSessions = getSessionsFromDate(this.props.sessions, currentDate);
                        let sessionsDateHTML = _.map(listSessions, session => {
                            return(
                                <SessionButton selected = { this.props.calendar.hasOwnProperty("selectedSession") && this.props.calendar.selectedSession === session } 
                                    session = {session}  updateSession = { () => this.updateSession(session)}>

                                </SessionButton>
                            );
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
                            if(this.props.calendar.hasOwnProperty("selectedSession") && this.props.calendar.selectedSession === session){
                                return (
                                <SessionButtonSelected disabled={true} className="sessionButton selected" onClick={ (e) => { this.selectedSession(session) }}>
                                    <OccupancyMeterHolder>
                                        <OccupancyMeter className={occupancyClassName} />
                                    </OccupancyMeterHolder>
                                    <TimeHolder>
                                        { moment(session.startSession*1000).format("HH:mm") }
                                    </TimeHolder>    
                                </SessionButtonSelected>);
                            }
                            else if((this.state.sessionLoading == session.idSession) && (!this.props.tags.dictTags.hasOwnProperty(session.idSession))){
                                return(<SessionButton className="sessionButton" onClick={ (e) => { this.selectedSession(session) }}>
                                        <OccupancyMeterHolder>
                                            <OccupancyMeter className={occupancyClassName} />
                                        </OccupancyMeterHolder>
                                        <TimeHolder>
                                            { moment(session.startSession*1000).format("HH:mm") }
                                        </TimeHolder>
                                        <LoadingBall>
                                            <img src="/img/loading.gif" height="100%" />
                                        </LoadingBall>
                                    </SessionButton>);
                            }
                            else{
                                if((this.state.sessionLoading === session.idSession) && (this.props.tags.dictTags.hasOwnProperty(session.idSession) ||!session.extra.hasTags)){
                                    this.setState({sessionLoading : null});
                                    this.selectedSession(session);
                                }                                
                                return(
                                    <SessionButton className="sessionButton" onClick={ (e) => { this.selectedSession(session) }}>
                                        <OccupancyMeterHolder>
                                            <OccupancyMeter className={occupancyClassName} />
                                        </OccupancyMeterHolder>
                                        <TimeHolder>
                                            { moment(session.startSession*1000).format("HH:mm") }
                                        </TimeHolder>
                                    </SessionButton>);
                            }
                            
                        });
                        currentElement = 
                        <DayContainer className="dayCore" key={i}>
                            <DayMonthHolder>{ (i -firstWeekday)+ 1 }</DayMonthHolder>
                            <SessionsContainer>{sessionsDateHTML}</SessionsContainer>
                        </DayContainer>;
                                         
                    }                
                }
                else{
                    currentElement = <DayContainer className="emptyDay" key={i} ></DayContainer>;    
                }   
    
                //currentContainer =  <DayContainer className="dayContainer" key={i} >{ currentElement }</DayContainer>;    
                datesMonthItem.push(currentElement);
                // if(i % 7 == 0 && i !== 0){
                //     calendarHTML[weekIndex] = <WeekContainer key={ weekIndex }>{ weekContainer }</WeekContainer>  ;
                //     weekIndex++;
                //     weekContainer = [];//Necesito asignar otra dirección de memoria.
                // }
    
                weekContainer[i % 7] = currentContainer;     
            }
            arrayMonthItemsHTML.push( 
                <MonthItem className="monthItem">
                    <MonthDayContainer width={ this.widthCalendar }>
                        { datesMonthItem }
                    </MonthDayContainer>
                </MonthItem>);
            //Añado un mes para hacer el mismo proceso pero avanzando un mes
            momentObj.add(1, 'M');
        }        
        
        
        let currentMonth = (this.props.calendar.hasOwnProperty("selectedSession")) ? moment(this.props.calendar.selectedSession.startSession*1000) : moment(this.calConf.minDate);
        return(
            <Calendar id="calendar" width={ this.widthCalendar }>
                <MonthContainer className="month_container">
                    <MonthSelector className="month_container month_selector">
                        <IconSelect disabled = {true} onClick={ this.prevMonth } ref={this.refPrevMonth} className="month_container icon_select material-icons align-middle">keyboard_arrow_left</IconSelect>
                    </MonthSelector>
                    <MonthHolder ref={this.refStringCurrentMonth}>{ currentMonth.format('MMMM YYYY') }</MonthHolder>
                    <MonthSelector>
                        <IconSelect disabled = { this.arrayObjMonths.length === 1} onClick={ this.nextMonth } ref={this.refNextMonth} className="month_container icon_select material-icons align-middle">keyboard_arrow_right</IconSelect>
                    </MonthSelector>
                </MonthContainer>
                <WeekDayContainer className="weekday_container">
                    <WeekDayHolder className="weekday_container weekday_holder">
                        L
                    </WeekDayHolder>
                    <WeekDayHolder className="weekday_container weekday_holder">
                        M
                    </WeekDayHolder>
                    <WeekDayHolder className="weekday_container weekday_holder">
                        X
                    </WeekDayHolder>
                    <WeekDayHolder className="weekday_container weekday_holder">
                        J
                    </WeekDayHolder>
                    <WeekDayHolder className="weekday_container weekday_holder">
                        V
                    </WeekDayHolder>
                    <WeekDayHolder className="weekday_container weekday_holder">
                        S
                    </WeekDayHolder>
                    <WeekDayHolder className="weekday_container weekday_holder">
                        D
                    </WeekDayHolder>
                </WeekDayContainer>
                <CoreCalendar onScroll={ this.handleScroll } className="core_calendar" id="sessions_time" ref={this.refScrollCalendar} >
                    <ScrollCalendar className="core_calendar scroll_calendar">
                        { arrayMonthItemsHTML }
                    </ScrollCalendar>
                </CoreCalendar>
            </Calendar>
        );
    }
}

function mapStateToProps(state){
    return{
        calendar : state.calendar
    }
}

export default withLocalize(connect(mapStateToProps, { fetchTagsSession, updateSelectedSession, updateSelectedDate, resetSections, resetSeats, updateModalInfo, resetModal })(CalendarEndless));  