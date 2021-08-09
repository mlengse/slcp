if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}
const Core = require('./core')
const config = require('./config')

const app = new Core(config)

module.exports = async (isPM2) => {

  try{
    app.spinner.start('init apps')
    await app.fetchKasus()
    await app.cleanData()
    // await app.upsertData()

    let num = 0
    for(let nik of app.indeksKasus)
    if(app.filter14(app.people[nik].konfirm_tgl_onset))
    {
      if(app.people[nik].isKonfirm && !app.people[nik].isKonter){
        num++
        // 1. push konfirm yg !konter
        await app.pushConfirm({ confirmData: app.people[nik] })

      }

      let namaIndeks
      if(app.people[nik].isKonter){
        namaIndeks = app.people[Object.keys(app.people).filter(iknik => app.people[nik].konter_kelurahan === app.people[iknik].konfirm_kelurahan && app.people[nik].konter_indeks === app.people[iknik].konfirm_no)[0]].nama
        // 2. push konter dari konfirm (1)
        // konfirm = await app.pushKonter({ konterData: konter, confirmData: konfirm})

        if(app.people[nik].isKonfirm){
          // 3. push konter (2) yg jadi konfirm

        }
      }
      app.spinner.succeed(`${num} ${app.people[nik].nama}${app.people[nik].isKonter ? ` konter ${namaIndeks} tgl_kontak ${app.people[nik].konter_tgl_kontak}` : ''}${app.people[nik].isKonfirm && app.people[nik].isKonter? ' =>' : ''}${app.people[nik].isKonfirm ? ` konfirm tgl_onset ${app.people[nik].konfirm_tgl_onset}` : ''}`)
    }

    await app.close(isPM2)

    console.log(`silacak process done: ${new Date()}`)
  }catch(e){
    console.error(`process error: ${new Date()} ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`)
  }
}