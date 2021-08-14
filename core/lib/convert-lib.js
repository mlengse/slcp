exports._convertKonterToKonfirm =  async ({ that, person, indeksKasus }) => {

  await that.loginSilacak()

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

  // that.spinner.succeed(`${JSON.stringify(person)}`)

  let btnTambahKonter = await that.page.$$eval('button.ant-btn-primary', els => els && els.length && [...els].filter( e => e.innerText 
    && e.innerText.toLowerCase().includes(`tambah kontak erat baru` )).length)

  while(!btnTambahKonter){
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
    // console.log(konterData.nik)
    exists = await that.page.evaluate( (el, nik) => el.innerText.includes(nik), table, person.nik)
    if(exists){
      let trs = await that.page.$$('tr.ant-table-row')
      if(trs.length) for(let tr of trs) {
        let td = await tr.$('td.ant-table-cell > a')
        if(td){
          let nama = await td.evaluate( a => a.innerText)
          if(nama){
            let [row] = await that.page.$x(`//tr[contains(.,'${nama}')]`)
            if(row){
              let hari = await row.$(`td.ant-table-cell[style="text-align: center;"]:nth-child(${1+Number(person.selisihEntryOnset)})`)
              if(hari){
                that.spinner.succeed(`${nama} tgl entry ${person.konter_tgl_entry} terkonfirmasi setelah karantina hari ke-${person.selisihEntryOnset} di tgl ${person.konfirm_tgl_onset}`)
                await hari.evaluate( e => e.click())
                await that.page.waitForTimeout(5000)
                console.log('sudah klik')
              }
            }

          }
        }
      }
    }
    // that.spinner.succeed(`cari konter by NIK in confirm tab | nik: ${person.nik}, exists: ${exists}`)


    //==============================================================

  } 


  await that.page.waitForTimeout(10000)
}