import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../client/src/pages/MapzMapDemo.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source.slice(source.indexOf('const pacificHourFormatter'),source.indexOf('function dateTimeLocalValue'))+'\nglobalThis.formatters={hour,portlandCalendarDay};',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
function load(){let constructions=0;const context={Date,Number,Intl:{DateTimeFormat:function(...args){constructions++;return new Intl.DateTimeFormat(...args)}}};vm.runInNewContext(code,context);return {...context.formatters,count:()=>constructions};}
const previousDay=value=>{const date=value instanceof Date?value:new Date(value);if(!Number.isFinite(date.getTime()))return '';return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(date)};
const previousHour=value=>{try{return new Intl.DateTimeFormat('en-US',{hour:'numeric',hour12:true,timeZone:'America/Los_Angeles'}).format(new Date(value)).replace(' ','').replace('M','')}catch{return ''}};
const dates=['2026-01-01T07:59:59.999Z','2026-01-01T08:00:00.000Z','2026-07-01T06:59:59.999Z','2026-07-01T07:00:00.000Z','2026-03-08T09:59:59.999Z','2026-03-08T10:00:00.000Z','2026-11-01T08:59:59.999Z','2026-11-01T09:00:00.000Z'];
test('reused formatters match previous output across Pacific midnight and both DST transitions',()=>{
 const format=load();for(const iso of dates){assert.equal(format.hour(iso),previousHour(iso),iso);for(const value of [iso,Date.parse(iso),new Date(iso)])assert.equal(format.portlandCalendarDay(value),previousDay(value),iso);}
 assert.notEqual(format.portlandCalendarDay(dates[0]),format.portlandCalendarDay(dates[1]));assert.notEqual(format.portlandCalendarDay(dates[2]),format.portlandCalendarDay(dates[3]));
 assert.equal(format.hour(dates[4]),'1A');assert.equal(format.hour(dates[5]),'3A');assert.equal(format.hour(dates[6]),'1A');assert.equal(format.hour(dates[7]),'1A');
});
test('invalid values preserve empty-string behavior and mutated Date inputs are evaluated anew',()=>{
 const format=load();for(const value of ['invalid','',NaN,new Date(NaN)]){assert.equal(format.portlandCalendarDay(value),previousDay(value));assert.equal(format.hour(value),previousHour(value));}
 const date=new Date(dates[0]);const before=format.portlandCalendarDay(date);date.setTime(Date.parse(dates[1]));assert.notEqual(format.portlandCalendarDay(date),before);assert.equal(format.portlandCalendarDay(date),previousDay(date));
});
test('repeated formatting constructs only the two fixed formatter instances',()=>{
 const format=load();assert.equal(format.count(),2);for(let i=0;i<500;i++){format.portlandCalendarDay(dates[i%dates.length]);format.hour(dates[i%dates.length]);}assert.equal(format.count(),2);
});
