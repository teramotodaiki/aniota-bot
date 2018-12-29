import fetch from 'node-fetch'
import { URLSearchParams } from 'url'
import { load } from 'cheerio'

export interface BaseParams {
  [key: string]: string | string[]
}
export interface TitleLookupParams extends BaseParams {
  TID: string
}
export interface TitleLookupResult {
  tid: string
  last_update: string
  title: string
  short_title: string
  title_yomi: string
  title_en: string
  comment: string
  url?: string
}

export interface CalChkParams extends BaseParams {
  days: string
}

export interface CalChkResult {
  pid: string
  tid: string
  st_time: string
  ed_time: string
  ch_name: string
  ch_id: string
  st_offset: string
  sub_title: string
  title: string
}

const endpoint = 'http://cal.syoboi.jp'
const api = {
  db: endpoint + '/db.php',
  calChk: endpoint + '/cal_chk.php'
}
const urlRegExp = /https?:\/\/[!#%'()*-./?0-9A-Z_a-z~]+/g

export function getTitleLookupUrl(params: TitleLookupParams) {
  const search = new URLSearchParams(params)
  return `${api.db}?Command=TitleLookup&${search.toString()}`
}

export function parseTitleLookupResponse(xml: string): TitleLookupResult {
  const $ = load(xml, { xmlMode: true })
  const comment = $('Comment')
    .text()
    .replace(/\r\n/g, '\n')
  const result = urlRegExp.exec(comment)
  return {
    tid: $('TID').text(),
    last_update: $('LastUpdate').text(),
    title: $('Title').text(),
    short_title: $('ShortTitle').text(),
    title_yomi: $('TitleYomi').text(),
    title_en: $('TitleEN').text(),
    comment,
    url: result ? result[0] : undefined
  }
}

export async function titleLookup(
  params: TitleLookupParams
): Promise<TitleLookupResult> {
  const response = await fetch(getTitleLookupUrl(params))
  const xml = await response.text()
  return parseTitleLookupResponse(xml)
}

export function getCalChkUrl(params: CalChkParams) {
  const search = new URLSearchParams(params)
  return `${api.calChk}?${search.toString()}`
}

export function parseCalChkResponse(xml: string): CalChkResult[] {
  const $ = load(xml, { xmlMode: true })
  return $('ProgItem')
    .toArray()
    .map(progItem => {
      return {
        pid: progItem.attribs.pid,
        tid: progItem.attribs.tid,
        st_time: progItem.attribs.st_time,
        ed_time: progItem.attribs.ed_time,
        ch_name: progItem.attribs.ch_name,
        ch_id: progItem.attribs.ch_id,
        st_offset: progItem.attribs.st_offset,
        sub_title: progItem.attribs.sub_title,
        title: progItem.attribs.title
      }
    })
}

export async function calChk(params: CalChkParams) {
  const response = await fetch(getCalChkUrl(params))
  const xml = await response.text()
  return parseCalChkResponse(xml)
}
