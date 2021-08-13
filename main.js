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
    // if(app.filter14(app.people[nik].konfirm_tgl_onset))
    {
      let person = app.people[nik]

      person = await app.upsertPerson({person})

      if(person.isKonfirm && !person.isKonter){
        num++
        if(!person.konfirm_silacak){
          // 1. push konfirm yg !konter
          await app.pushConfirm({ confirmData: person })
        }
      }

      let namaIndeks
      if(person.isKonter){
        let confirmData = app.people[Object.keys(app.people)
          .filter(iknik => person.konter_kelurahan === app.people[iknik].konfirm_kelurahan 
            && person.konter_indeks === app.people[iknik].konfirm_no)[0]]
        namaIndeks = confirmData.nama
        // 2. push konter dari konfirm (1)
        // if(!person.konter_silacak){
          await app.pushKonter({ 
            konterData: person, 
            confirmData
          })
        // }

        if(person.isKonfirm){
          // 3. push konter (2) yg jadi konfirm
          await app.convertKonterToKonfirm({ person, indeksKasus: confirmData })

        }
      }
      app.spinner.succeed(`${num} ${person.nama}${person.isKonter ? ` konter ${namaIndeks} tgl_kontak ${person.konter_tgl_kontak}` : ''}${person.isKonfirm && person.isKonter? ' =>' : ''}${person.isKonfirm ? ` konfirm tgl_onset ${person.konfirm_tgl_onset}` : ''}`)
      app.spinner.succeed(`---------------------------------------------------`)
    }

    await app.close(isPM2)

    console.log(`silacak process done: ${new Date()}`)
  }catch(e){
    console.error(`process error: ${new Date()} ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`)
  }
}