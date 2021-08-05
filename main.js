if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}
const Core = require('./core')
const config = require('./config')

const app = new Core(config)

module.exports = async (isPM2) => {

  try{
    await app.init()

    await app.fetchKasus()

    let num = 1

    for( let konter of app.listKonters) {
      if(konter.nik && Object.keys( konter ).filter( e => e.includes('nama_indeks')).length ) {
        let { NEW } = await app.arangoUpsert({
          coll: 'konter',
          doc: Object.assign({}, konter, {
            _key: konter.nik
          })
        })
  
        if(!NEW.silacak) {
          if(Number(NEW.nama_indeks_kasus) != NEW.nama_indeks_kasus){
            if(NEW.nama_indeks_kasus.toLowerCase().includes('no')){
              let noIndeksKasus = NEW.nama_indeks_kasus.toLowerCase().split('no')
              noIndeksKasus = noIndeksKasus[noIndeksKasus.length-1]
              if(noIndeksKasus.includes('.')){
                noIndeksKasus = noIndeksKasus.split('.').join('')
              }
              noIndeksKasus = noIndeksKasus.trim()
              NEW.nama_indeks_kasus = noIndeksKasus
            }

          }
          if(Number(NEW.nama_indeks_kasus) == NEW.nama_indeks_kasus) {

            let confirm = app.listConfirms.filter( e => e.kelurahan === NEW.kelurahan && e.no === NEW.nama_indeks_kasus)[0]


            let res = await app.arangoUpsert({
              coll: 'konfirm',
              doc: Object.assign({}, confirm, {
                _key: `${confirm.kelurahan}_${confirm.no}`
              })
            })

      
            if(!res.NEW.silacak && NEW.nik && confirm.nik) {
              // push ke silacak
              confirm = res.NEW

              console.log(num)
              
              console.log(NEW.nama_indeks_kasus, NEW.kelurahan, NEW.nama, NEW.nik)
              console.log(confirm.no, confirm.kelurahan, confirm.nama, confirm.nik)

              console.log('-----------')

              num++

              await app.loginSilacak()
              
      
            }
      

          }
        }
      }


    }

    // console.log(confirms)
    // let tanggals = [ ...new Set(kontaks.map(({ Tanggal }) => Tanggal))]
    // let listDaft = []
    // for( tanggal of tanggals){
    //   let daft = (await app.getPendaftaranProvider({ 
    //     tanggal: app.tglPcareFromKontak(tanggal)
    //   }))

    //   listDaft = [ ...listDaft, ...daft.map(({ peserta: {noKartu}}) => noKartu)]
    // }
    // // console.log(listDaft)
    // // let listDaft = (await app.getPendaftaranProvider()).map(({ peserta: {noKartu}}) => noKartu)
    // // listDaft = [ ...listDaft, ...(await app.getPendaftaranProvider({ tanggal: app.tglKemarin()})).map(({ peserta: {noKartu}}) => noKartu)]

    // for (kontak of kontaks){
    //   kontak = await app.upsertKontakJKN({ doc: kontak })
    //   if( !listDaft.filter( e => e === kontak.No_JKN ).length ){
    //     let peserta 
    //     if(kontak.aktif || kontak.ketAktif){
    //       peserta = kontak
    //     } else {
    //       let pstJKN = await app.getPesertaByNoka({
    //         noka: kontak.No_JKN
    //       })
    //       kontak = Object.assign({}, kontak, pstJKN)
    //       peserta = await app.upsertKontakJKN({ doc: kontak })
    //     }

    //     if(peserta && !peserta.daftResponse && peserta.aktif /* &&  peserta.kdProviderPst.kdProvider.trim() === app.config.PROVIDER*/ ){

    //       // check if kontak not registered yet
    //       let historyCheck = (await app.getRiwayatKunjungan({ peserta })).filter( ({ tglKunjungan }) => app.checkDate( tglKunjungan, kontak.Tanggal))

    //       if(!historyCheck.length){
  
    //         let message = await app.sendToWS({kontak: peserta})

    //         message = await app.upsertKontakJKN({ doc: message })

    //         if(!message.from && message.daftResponse && JSON.stringify(message.daftResponse).includes('CREATED')) {

    //           let textwa = await app.sendToWA({
    //             message
    //           })

    //           message = await app.upsertKontakJKN({ doc: textwa })

    //         }
  
    //         // console.log(message)
    //       }
    
    //     }
  
    //   }

    // }

    await app.close(isPM2)

    console.log(`silacak process done: ${new Date()}`)
  }catch(e){
    console.error(`process error: ${new Date()} ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`)
  }
}