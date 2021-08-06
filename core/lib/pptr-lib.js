const pptr = require('puppeteer-core')
const waitOpt = {
  waitUntil: 'networkidle2',
  timeout: 0
}

exports.waitOpt = waitOpt      
exports._waitNav = async ({ that }) => await that.page.waitForNavigation(waitOpt)

exports._pushConfirm = async ({ that, confirmData }) => {
  if(!confirmData.silacak) {
    // push ke silacak
    await that.loginSilacak()
  }

}
exports._pushKonter = async ({ that, konterData }) => {
  if(!konterData.silacak) {
    await that.loginSilacak()

  }
}

exports._loginSilacak = async ({ that }) => {
  !that.Browser && await that.initBrowser()

  let needLogin = await that.page.$('input#username')

  if(needLogin) {
    that.spinner.start('login silacak')
    await that.page.type('input#username', that.config.SILACAK_USER)
    await that.page.type('input#password', that.config.SILACAK_PASSWORD, { delay: 100 })
    await that.page.click('button.btn.btn-login[name="loginbtn"][type="submit"]', {delay: 500})
    await that.page.waitForNavigation(waitOpt),
      // await that.page.click('button#app.userAuth.signIn')
  
    // let inpVal = await that.page.evaluate(() => document.getElementById('CaptchaInputText').value)
    // while(!inpVal || inpVal.length < 5 ){
    //   inpVal = await that.page.evaluate(() => document.getElementById('CaptchaInputText').value)
    // }
  
    // const [response] = await Promise.all([
    //   that.page.waitForNavigation(waitOpt),
    //   // that.page.type('#CaptchaInputText', String.fromCharCode(13)),
    //   // that.page.click('#btnLogin', {delay: 500}),
    //   that.page.click('button.btn.btn-login[name="loginbtn"][type="submit"]', {delay: 500})
    // ]);
    
    that.spinner.succeed('logged in')
  
  }

}

exports._daftarDelete = async ({ that, pendaftar }) => {
  return await that.page.evaluate( data => {
    $.ajax({
      url: base_url + "/EntriDaftarDokkel/DaftarDelete",
      data: JSON.stringify(data),
      contentType: "application/json",
      type: "POST",
      success: function (data) {
        if (data.metaData.code === 200) {
          // riwayatPendaftaran.ajax.reload();
          showMessage(200, 'Data berhasil di hapus');
        }
        else errorHandler(data);
      },
      error: function (err) {
        errorHandler(err.responseJSON);
      }
    });
  }, pendaftar)
}

exports._getPendaftarByPpkTgl = async ({ that, tgldaftar }) =>{
  that.spinner.start(`get pendaftar by ppk tgl: ${tgldaftar}`)

  let faskes = that.config.PCAREUSR
  await that.page.evaluate(async (tgldaftar, faskes) => {

    $('#bulanRiwayat').val(tgldaftar);

    if (riwayatPendaftaran != null) {
      riwayatPendaftaran.ajax.reload();
      return riwayatPendaftaran.ajax.json();
    }

    riwayatPendaftaran = $('#example').DataTable({
      "processing": true,
      "serverSide": true,
      "ordering": false,
      "searching": false,
      "lengthChange": false,
      "pageLength": 1000,
      "select": {
        style: 'single'
      },
      "scrollX": true,
      ajax: {
        url: base_url + '/EntriDaftarDokkel/getPendaftarByPpkTgl',
        type: "POST",
        data: function (param) {
          param.tgldaftar = $('#bulanRiwayat').val();
          param.refAsalKunjungan = $('#kunjSakitRiwayat').val();
          param.kdppk = faskes;
        },
        dataFilter: dataTablesResponse,
        error: function (xhr) {
          errorHandler(JSON.parse(xhr.responseText));
        }
      },
      columnDefs: [
        {
          'targets': 8,
          'render': function (a, b, data, meta) {
            if (data.status === 0) {
              return "<div class='btn-group'> " 
              + "<button type='button' class='btn btnDelete btn btn-danger' onclick=\"chooseDeleteDaftarRiwayat('" + meta.row + "')\"><i class='fa fa-trash'></i></button>" 
              + "</div>";
            }
            return "";
          }
        },
        {
          'targets': 2,
          'render': function (a, b, data, meta) {
            if (data.pesertaProlanis.isProlanis && data.pesertaProlanis.isPesertaPRB) {
              return "<label style='color:red' title='Peserta Prolanis & PRB'>" + data.peserta.nama + "</label>";
            } else if (data.pesertaProlanis.isProlanis) {
              return "<label style='color:#b8ca35' title='Peserta Prolanis Tanpa PRB'>" + data.peserta.nama + "</label>";
            } else if (data.pesertaProlanis.idPrbDM > 0 || data.pesertaProlanis.idPrbHT > 0) {
              return "<label style='color:green' title='Peserta PRB'>" + data.peserta.nama + "</label>";
            }
            return "<label style='font-weight:normal;'>" + data.peserta.nama + "</label>";
          }
        }
      ],
      columns: [
        {
          data: function (data) {
            return data.aliasAntrian + data.noUrut;
          }
        },
        { data: 'peserta.noKartu' },
        {
          data: function (data) {
            return data;
          }
        },
        { data: 'peserta.sex' },
        {
          data: function (data) {
            return calcAge(strToDate(data.peserta.tglLahir));
          }
        },
        { data: 'poli.nmPoli' },
        {
          data: function (data) {
            return getSumberPendaftaran(data.fromWs);
          }
        },
        {
          data: function (data) {
            return getStatusPendaftaran(data.status);
          }
        }
      ]
    });

    return riwayatPendaftaran.ajax.json()

  }, tgldaftar, faskes)

  await that.page.waitForTimeout(5000)

  let pendaftar = await that.page.evaluate(() => riwayatPendaftaran.ajax.json())

  if(pendaftar && pendaftar.response && pendaftar.response.data && pendaftar.response.data.length) {
    that.spinner.succeed(`daftar tgl: ${tgldaftar} jml: ${pendaftar.response.data.length}`)
    return pendaftar.response.data
  }
  return []
}


exports._runScript = async ({ that }) => {
  await that.loginPcare()
}

exports._initBrowser = async ({ that }) => {
  // if(that.init){
    // await that.init()
  // }

  if(!that.Browser) {
    that.Browser = await pptr.launch({
      headless: false,
      executablePath: `${that.config.CHROME_PATH}`,
      userDataDir: `${that.config.USER_DATA_PATH}`,
    })
  
  }

  that.pages = await that.Browser.pages()

  that.page = that.pages[0]
  await that.page.goto(`${that.config.SILACAK_URL}`, waitOpt)

}