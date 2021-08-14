exports._inputConvert =  async ({ that, person }) => {
  await that.page.waitForSelector('#FollowUpForm_eventDate')
  
  await that.inputTgl({
    element: 'FollowUpForm_eventDate',
    tgl: person.konfirm_tgl_onset
  })

  await that.findXPathAndClick({ xpath: '//span[contains(.,"Ya")]'})

  await that.page.waitForSelector('#FollowUpForm_tesDate')
  
  await that.inputTgl({
    element: 'FollowUpForm_tesDate',
    tgl: person.konfirm_tgl_onset
  })

  await that.findXPathAndClick({ xpath: '//label[contains(@class, "ant-radio-button-wrapper") and contains(.,"PCR")]'})
  await that.findXPathAndClick({ xpath: '//label[contains(@class, "ant-radio-button-wrapper") and contains(.,"Positif")]'})

  await that.clickBtn({ text: 'Simpan'})
  await that.findXPathAndClick({ xpath: '//button[contains(@class, "ant-btn-sm") and contains(.,"Ya")]'})
  await that.page.waitForTimeout(5000)



}
exports._convertKonterToKonfirm =  async ({ that, person, indeksKasus }) => {

  // that.spinner.succeed(`${JSON.stringify(person)}`)
  await that.loginSilacak()

  let btnTambahKonter = await that.page.$$eval('button.ant-btn-primary', els => els && els.length && [...els].filter( e => e.innerText 
    && e.innerText.toLowerCase().includes(`tambah kontak erat baru` )).length)

  while(!btnTambahKonter){

    await that.page.reload()
  
    await that.cariConfirmByNIK({nik: indeksKasus.nik})
  
    let [row] = await that.page.$x(`//tr[contains(.,'${indeksKasus.nik}')]`)
    while(!row){
      await that.page.waitForTimeout(500);
      [row] = await that.page.$x(`//tr[contains(.,'${indeksKasus.nik}')]`)
    }
    let hrefEl = await row.$('td > a')
    let href = await that.page.evaluate( el => el.getAttribute('href').split('/')[el.getAttribute('href').split('/').length-1], hrefEl)
  
    await hrefEl.click()
  
    // console.log(href)
  
    await that.page.waitForResponse(response=> response.url().includes(href) && response.status() === 200)
  
    if(!indeksKasus.href){
      indeksKasus.href = href
    }  
  
    await that.gotoKonterTab()

    btnTambahKonter = await that.page.$$eval('button.ant-btn-primary', els => els && els.length && [...els].filter( e => e.innerText 
      && e.innerText.toLowerCase().includes(`tambah kontak erat baru` )).length)
  }

  let exists = false
  
  // await that.page.waitForResponse(response=> response.url().includes(`Gf4Ojyk54rO`) && response.status() === 200)
  await that.page.waitForTimeout(500);

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
      let trs = await that.page.$$('tr.ant-table-row')
      // console.log('trs.length', trs.length)
      if(trs.length) for(let tr of trs) {
        let td = await tr.$('td.ant-table-cell > a')
        if(td){
          let nama = await td.evaluate( a => a.innerText)
          // console.log(nama)
          if(nama){
            let rows = await that.page.$x(`//tr[contains(.,'${nama}')]`)
            if(rows.length) for (let row of rows) {
              // console.log(row[0])
              let hari = await row.$(`td.ant-table-cell[style="text-align: center;"]:nth-child(${1+Number(person.selisihEntryOnset)})`)
              // console.log(!!hari)
              if(hari){
                let sudah = await hari.$('span.anticon.anticon-plus-circle')
                if(!sudah){
                  that.spinner.succeed(`${nama} tgl entry ${person.konter_tgl_entry} terkonfirmasi setelah karantina hari ke-${person.selisihEntryOnset} di tgl ${person.konfirm_tgl_onset}`)
                  await hari.evaluate( e => e.click())
                  await that.inputConvert({ person })
                  // console.log('sudah klik')
  
                }
              }

              person.konfirm_silacak = true

            }
          }
        }
      }
    }
    // that.spinner.succeed(`cari konter by NIK in confirm tab | nik: ${person.nik}, exists: ${exists}`)


    //==============================================================

  } 


  // await that.page.waitForTimeout(10000)
}