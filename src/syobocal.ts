import fetch from 'node-fetch'
import { URLSearchParams } from 'url'
import { load } from 'cheerio'
import { includes, toPairs } from 'lodash'
import { Talent } from './talent'

export interface BaseParams {
  [key: string]: string | string[]
}
export interface TitleLookupParams extends BaseParams {
  TID: string
  LastUpdate?: string
}

export enum TitleCategory {
  'アニメ' = 1,
  'アニメ(終了/再放送)' = 10,
  'OVA' = 7,
  'アニメ関連' = 5,
  '特撮' = 4,
  '映画' = 8,
  'テレビ' = 3,
  'ラジオ' = 2,
  'メモ' = 6,
  'その他' = 0
}

export interface TitleLookupResult {
  tid: string
  last_update: string
  title: string
  short_title: string
  title_yomi: string
  title_en: string
  comment: string
  cat: TitleCategory
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

export interface Credit {
  name: string
  roles: {
    role: string // role
    group: string
  }[]
}

const endpoint = 'http://cal.syoboi.jp'
const api = {
  db: endpoint + '/db.php',
  calChk: endpoint + '/cal_chk.php'
}
const urlRegExp = /https?\:\/\/[!#%'()*-./?0-9A-Z_a-z~]+/g

export function getTitleLookupUrl(params: TitleLookupParams) {
  const search = new URLSearchParams(params)
  return `${api.db}?Command=TitleLookup&${search.toString()}`
}

export function parseTitleLookupResponse(xml: string): TitleLookupResult[] {
  const $ = load(xml, { xmlMode: true })
  return $('TitleItem')
    .toArray()
    .map(item => {
      const $item = $(item)
      const comment = $item
        .find('Comment')
        .text()
        .replace(/\r\n/g, '\n')
      const result: TitleLookupResult = {
        tid: $item.find('TID').text(),
        last_update: $item.find('LastUpdate').text(),
        title: $item.find('Title').text(),
        short_title: $item.find('ShortTitle').text(),
        title_yomi: $item.find('TitleYomi').text(),
        title_en: $item.find('TitleEN').text(),
        cat: parseInt($item.find('Cat').text(), 10),
        comment
      }
      const foundUrl = urlRegExp.exec(comment)
      if (foundUrl) {
        result.url = foundUrl[0]
      }
      return result
    })
}

export async function titleLookup(
  params: TitleLookupParams
): Promise<TitleLookupResult[]> {
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

type CommentLineObject =
  | {
      type: '*'
      group: string
    }
  | {
      type: ':'
      role: string
      people: string
    }
  | null

export function parseCreditsFromComment(
  comment: string,
  talents: { [id: string]: Talent }
): { [key: string]: Credit } {
  const credits: { [key: string]: Credit } = {}
  const commentLines: CommentLineObject[] = []
  // パース
  for (const lineText of comment.split('\n')) {
    switch (lineText.substr(0, 1)) {
      case '*':
        // e.g. "*スタッフ"
        commentLines.push({ type: '*', group: lineText.substr(1) })
      case ':':
        // e.g. ":原作:川原礫(電撃文庫)"
        const [, role, people] = lineText.split(':')
        commentLines.push({ type: ':', role, people })
    }
  }
  // talent ごとに走査
  let group = ''
  for (const [talent_id, talent] of toPairs(talents)) {
    const credit: Credit = { name: talent.name, roles: [] }
    for (const line of commentLines) {
      if (line.type === '*') {
        group = line.group
      } else if (includes(line.people, talent.name)) {
        credit.roles.push({ role: line.role, group })
      }
    }
    if (credit.roles.length > 0) {
      credits[talent_id] = credit // １つでもロールがあれば追加
    }
  }
  return credits
}
