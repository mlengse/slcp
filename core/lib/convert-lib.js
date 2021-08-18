exports._inputConvert =  async ({ that, person }) => {
  // await that.waitFor({selector: '#FollowUpForm_eventDate'})
  
  await that.inputTgl({
    element: 'FollowUpForm_eventDate',
    tgl: person.konfirm_tgl_onset
  })

  await that.findXPathAndClick({ xpath: '//span[contains(.,"Ya")]'})

  await that.waitFor({selector:'#FollowUpForm_tesDate'})
  
  await that.inputTgl({
    element: 'FollowUpForm_tesDate',
    tgl: person.konfirm_tgl_onset
  })

  await that.findXPathAndClick({ xpath: '//label[contains(@class, "ant-radio-button-wrapper") and contains(.,"PCR")]'})
  await that.findXPathAndClick({ xpath: '//label[contains(@class, "ant-radio-button-wrapper") and contains(.,"Positif")]'})

  await that.clickBtn({ text: 'Simpan'})
  await that.findXPathAndClick({ xpath: '//button[contains(@class, "ant-btn-sm") and contains(.,"Ya")]'})
  await that.page.waitForTimeout(2000)

  await that.spinner.succeed(`ubah konter ${person.nama} tgl tes ${person.konfirm_tgl_onset}`)



}
exports._convertKonterToKonfirm =  async ({ that, person, indeksKasus }) => {

  // that.response = false

  // that.spinner.succeed(`${JSON.stringify(person)}`)
  await that.loginSilacak()
  let exists = false

  let btnTambahKonter = await that.page.$$eval('button.ant-btn-primary', els => els && els.length && [...els].filter( e => e.innerText 
    && e.innerText.toLowerCase().includes(`tambah kontak erat baru` )).length)

  while(!btnTambahKonter){

    await that.reload()
  
    exists = await that.cariConfirmByNIK({confirmData: indeksKasus})

    if(exists){
      let [row] = await that.page.$x(`//tr[contains(.,'${indeksKasus.nik}')]`)
      while(!row){
        await that.page.waitForTimeout(100);
        [row] = await that.page.$x(`//tr[contains(.,'${indeksKasus.nik}')]`)
      }
      await that.page.waitForTimeout(500)
      let hrefEl = await row.$('td > a')
      let href = await that.page.evaluate( el => el.getAttribute('href').split('/')[el.getAttribute('href').split('/').length-1], hrefEl)
      
      that.response = false
      
      await row.$eval('td > a', e => e.click())
      
      // console.log(href)
    
      // await that.page.waitForResponse(response=> response.url().includes('.json') && response.url().includes(href) && response.status() === 200)
    
      if(!indeksKasus.href){
        indeksKasus.href = href
      }  

      // await that.page.waitForTimeout(2000);

      await that.gotoKonterTab()
      // await that.page.waitForTimeout(2000);
      while(!that.response){
        await that.page.waitForTimeout(100)
      }
      await that.page.waitForTimeout(500)
    
      // console.log(that.response)
      
      btnTambahKonter = await that.page.$$eval('button.ant-btn-primary', els => els && els.length && [...els].filter( e => e.innerText 
        && e.innerText.toLowerCase().includes(`tambah kontak erat baru` )).length)
  
    }
  
  }

  exists = false

  
  // await that.page.waitForResponse(response=> response.url().includes(`Gf4Ojyk54rO`) && response.status() === 200)

  let noKonter = await that.page.$$eval('div.ant-empty', els => els && els.length && [...els].filter( e => e.innerText 
    && e.innerText.toLowerCase().includes('tidak ada kontak erat')).length)
  if(!noKonter){
    //--------------------------------------------------------------

    // warning: cari konter dulu di listnya konter dari konfirm

    // console.log(JSON.stringify(that.response[that.response.length-1].json))
    let [table] = await that.page.$x("//table[contains(., 'Nama')]")
    while(!table){
      ;[table] = await that.page.$x("//table[contains(., 'Nama')]")
    }
    exists = await that.page.evaluate( (el, nik) => el.innerText.includes(nik), table, person.nik)
    // console.log(exists)
    if(exists){
      person.konter_nama_tersimpan = await that.page.evaluate( nik => {
        return [...document.querySelectorAll('tr.ant-table-row')]
        .filter(e => e.innerText.includes(nik))
        .map( e => e.innerText.split('\n')[0] )[0]
      }, person.nik)
      // console.log(person.konter_nama_tersimpan)
      let rows = await that.page.$x(`//tr[contains(.,'${person.konter_nama_tersimpan}')]`)
      if(rows.length) for (let row of rows) {
        // console.log(row[0])
        let hari = await row.$(`td.ant-table-cell[style="text-align: center;"]:nth-child(${1+Number(person.selisihEntryOnset)})`)
        // console.log(!!hari)
        if(hari){
          let sudah = await hari.$('span.anticon.anticon-plus-circle')
          if(!sudah){
            that.spinner.succeed(`${person.konter_nama_tersimpan} tgl entry ${person.konter_tgl_entry} terkonfirmasi setelah karantina hari ke-${person.selisihEntryOnset} di tgl ${person.konfirm_tgl_onset}`)
            await hari.evaluate( e => e.click())
            await that.inputConvert({ person })
            // console.log('sudah klik')

          }
          person.konfirm_silacak = true
        }

        person.konter_silacak = true
        person = Object.assign({}, await that.upsertPerson({ person: Object.assign({}, person, {
          konter_silacak: true
        }) }), person)


      }

    }


  } 

  // if(that.response.length) for(let konter of that.response) if(JSON.stringify(konter).includes(person.nik)){
  //   // that.spinner.succeed(`${JSON.stringify(konter)}`)
  //   let from = Object.fromEntries(konter.from.trackedEntityInstance.attributes.map( e => ([e.code, e.value])))
  //   let to = Object.fromEntries(konter.to.trackedEntityInstance.attributes.map( e => ([e.code, e.value])))
  //   that.spinner.succeed(`from ${JSON.stringify(from)}`)
  //   that.spinner.succeed(`to ${JSON.stringify(to)}`)
  // }

  await that.upsertPerson({ person })

}