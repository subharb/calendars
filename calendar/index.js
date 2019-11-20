import React, { Component } from 'react';
import { calendarConfiguration } from '../../../../helpers';
import CalendarMonth from './calendar_month';
import CalendarExpo from './calendar_expo';
import moment from 'moment';

const SESSIONS_LIMIT = 8;

class Calendar extends Component {
    constructor(props){
        super(props);

        this.calConf = calendarConfiguration(this.props.sessions);
    }
    
    render() {
        console.log(this.calConf);
        //Calcular el máximo de sesiones en un día, en función de eso mostrar uno u otro calendario
        if(this.calConf.maxSessionPerDay > SESSIONS_LIMIT){
            return <CalendarExpo calConf={this.calConf} {...this.props } />
            //return <CalendarSeveralMonths calConf={this.calConf} {...this.props } />
        }
        else{
            return <CalendarMonth calConf={this.calConf} {...this.props } />
        }
    
    }
}

export default Calendar;