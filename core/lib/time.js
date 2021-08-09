const moment = require('moment')
// moment.locale('id')

const getBaseDate = () => {
  let baseDate = moment().format('DD-MM-YYYY')
  if(process.env.BASE_DATE){
    baseDate = process.env.BASE_DATE
  }
  return baseDate
}

exports.tambah6 = tgl => moment(tgl, 'DD/MM/YYYY').add(6, 'days').format('DD/MM/YYYY')
exports.tambah1 = tgl => moment(tgl, 'DD/MM/YYYY').add(1, 'days').format('DD/MM/YYYY')
exports.kurang1 = tgl => moment(tgl, 'DD/MM/YYYY').add(-1, 'days').format('DD/MM/YYYY')
exports.filter14 = tgl => moment().diff(moment(tgl, 'DD/MM/YYYY'), 'days', false) < 14
exports.getTglDiff = (tgl, tglDef) => moment(tglDef, 'MMMYYYY').diff(moment(tgl, 'MMMYYYY'), 'months', false)
exports.umur = tgl => moment().diff(moment(tgl, 'MMYY'), 'years', false)
exports.bln = tgl => moment().format('MMM')
exports.changeToSlcBlnThn = tgl => moment(tgl, 'DD/MM/YYYY').format('MMMYYYY')
exports.changeToSlcTgl = tgl => moment(tgl, 'DD/MM/YYYY').format('D MMM YYYY')
// moment.now = () => +new Date('2021', '2', '28');
exports._fixTgl = async ({ that }) => {
  for(let nik of Object.keys(that.people) ){
    let person = that.people[nik]
    Object.keys(person).map( k => {
      if(k.toLowerCase().includes('tgl') || k.toLowerCase().includes('tanggal')) {
        if(k.includes('lahir')){
          delete person[k]
        } else {
          if(!(person[k].includes('/') && person[k].length === 10)){
            if(person[k].includes('/')){
              if(person[k].split('/')[person[k].split('/').length-1].length === 4){
                person[k] = moment(person[k], 'D/M/YYYY').format('DD/MM/YYYY') 
              } else if(person[k].split('/')[person[k].split('/').length-1].length === 2){
                person[k]=moment(person[k], 'D/M/YY').format('DD/MM/YYYY')
              } else {
                that.spinner.fail(`${person.nik}-${person.nama} ${k}: ${person[k]}`)
              }
            } else if(person[k].includes('-')){
              if(person[k].split('-')[person[k].split('-').length-2].length === 3){
                person[k] = moment(person[k], 'D-MMM-YYYY').format('DD/MM/YYYY')
              } else if(person[k].split('-')[person[k].split('-').length-1].length === 4){
                person[k] = moment(person[k], 'D-M-YYYY').format('DD/MM/YYYY')
              } else {
                that.spinner.fail(`${person.nik}-${person.nama} ${k}: ${person[k]}`)
              }
            } else {
                that.spinner.fail(`${person.nik}-${person.nama} ${k}: ${person[k]}`)
            }
          }
        }
      }
    })

    that.people[nik] = Object.assign({}, that.people[nik], person)
  }

}
exports.slashToStrip = tgl => moment(tgl, 'DD/MM/YYYY').format('YYYY-MM-DD')
exports.sortDate = tgl => moment(tgl, 'DD/MM/YYYY').format('YYYYMMDD')
exports.unixTime = () => moment().format('x')
