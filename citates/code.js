(function(window, undefined){
	
	var is_init = false,			//init scrollable div flag
		library,					//user library
		conteiner,					//conteiner for library list
		conteiner_2, 				//conteiner for bibliography 
		myscroll,					//custom scroll
		implicitGrantFlow,			//mendeley auth flow
		citations,					//citations 
		selectedStyle,				//selected style
		locale;						//selected locale
	

	window.Asc.plugin.init = function (text) {	
		loadStylesAndLocales('citeproc-js-simple/locales/locales.json', '#select_locale');
		loadStylesAndLocales('citeproc-js-simple/styles/styles.json', '#select_style');
		auth();
		var ref_but = document.getElementById('refresh_button');
		ref_but.onclick = function() {
			document.getElementById('loader').style.display ='block';
			document.getElementById('loader').style.position = 'absolute';
			auth();
		};
		var inpSearch = document.getElementById('inp_search');
		inpSearch.oninput = function(e) {
			pasteData(e.target.value);
		};
		if (!is_init) {
			myscroll = window.Asc.ScrollableDiv;
			myscroll.create_div("table_list",{
				maxWidth: "208px",
				minWidth: "208px",
				width: "",
				height: "",
				left: "20px",
				right: "",
				top: "53px",
				bottom: "16px"
			});
			myscroll.create_div("bibliography_prew",{
				maxWidth: "",
				maxWidth: "",
				width: "",
				height: "",
				left: "234px",
				right: "25px",
				top: "160px",
				bottom: "20px",
				border: '1px solid rgba(200, 200, 200, 0.5)'
			});
			myscroll.addEventListener();
			conteiner = document.getElementById('conteiner_id1');
			conteiner_2 = document.getElementById('conteiner_id2');
			is_init = true;
		}
		window.Asc.plugin.resizeWindow(800, 600, 800, 600, 0, 0);				//resize plugin window		
		window.onresize = function() {
			if (!is_init) return;
			myscroll.updateScroll(conteiner);
			myscroll.updateScroll(conteiner);
			myscroll.updateScroll(conteiner_2);
			myscroll.updateScroll(conteiner_2);
		};
	};

	function loadStylesAndLocales(dir,elem) {
		window.Asc.plugin.loadModule(dir, function(result){
			result = JSON.parse(result);
			var tmp = {},
				res = [];
			for (key in result) {
				tmp['id'] = key;
				tmp['text'] = result[key];
				res.push(JSON.parse(JSON.stringify(tmp)));
			}
			$(elem).select2({
				data: res,				
				// allowClear: true
			}).on('select2:select', function (e) {
				var data = e.params.data;
				loadSelected(data.id);
			});
			loadSelected($(elem + " option:selected").val())
		});
	};

	function loadSelected(file) {
		if (file.indexOf('.xml') == -1) {
			window.Asc.plugin.loadModule('citeproc-js-simple/styles/' + file, function(result){
				selectedStyle = result;
			});
		} else {
			window.Asc.plugin.loadModule('citeproc-js-simple/locales/' + file, function(result){
				locale = result;
			});
		}
	};

	function auth() {
		const SETTINGS = {
			clientId: 5468,
			redirectUrl: 'http://127.0.0.1:8001/sdkjs-plugins/mendeley/index.html'
		};
		implicitGrantFlow = MendeleySDK.Auth.implicitGrantFlow(SETTINGS);
		// implicitGrantFlow.authenticate();			//force autentification
		// var token = implicitGrantFlow.getToken();	//get token
		MendeleySDK.API.setAuthFlow(implicitGrantFlow);
		MendeleySDK.API.profiles.me().then(sucsess,failed);
	};

	function sucsess(result) {
		if (result.id) MendeleySDK.API.documents.retrieve(`?limit=500&uuid=${result.id}`).then(sucsess,failed); //MendeleySDK.API.documents.retrieve(`984e8e01-0fc0-3405-ae36-a17833c9286c?view=all`).then(sucsess,failed);  //MendeleySDK.API.documents.retrieve(`?limit=500&uuid=${result.id}`).then(sucsess,failed);
		if (result && result.length > 0) {
			library = result;
			pasteData();
			document.getElementById('loader').style.display ='none';
		}
	};
	function failed(error) {
		console.error(error);
		
	};

	function pasteData(value) {
		if (JSON.stringify(library) === '{}') {
			if (value || value === '')
			{
				var found = filter(library,value);
				if (JSON.stringify(found) === '{}')
				{
					$('label.item_list').remove();
					$('<label>', {
						class: 'item_list',
						style: 'cursor:default',
						text: 'No results found',
					}).appendTo('#conteiner_id1');
				} else {
					renderLibrary(found);
				}
			} else {
				renderLibrary(library);
			}
		} else {
			$('label.item_list').remove();
			$('<label>', {
				class: 'item_list',
				style: 'cursor:default',
				text: 'Library is empty',
			}).appendTo('#conteiner_id1');
		}
	};

	function filter (lib, val) {
		//maybe to search by the field shown?
		var newLib = {};
		for (k in lib) {
			for (prop in lib[k]) {
				if(prop == 'authors') {
					for (i in lib[k][prop]) {
						for (j in lib[k][prop][i]){
							if (lib[k][prop][i][j].toLowerCase().indexOf(val) != -1) {
								newLib[k] = lib[k];
								k++;
								break;
							}
						}
					}
				} else if(prop == 'identifiers') {
					for (i in lib[k][prop]) {
						if (lib[k][prop][i].toLowerCase().indexOf(val) != -1) {
							newLib[k] = lib[k];
							k++;
							break;
						}
					}
				} else if ((lib[k][prop]+'').toLowerCase().indexOf(val) != -1) {
					newLib[k] = lib[k];
					k++;
					break;
				}
			}
		}
		return newLib;
	}

	function renderLibrary(data) {
		$('label.item_list').remove();
		conteiner.innerHTML='';
		for (var i in data)
		{
			$('<label>', {
				class: 'item_list',
				text: data[i].title,
				on: {
					click: function(){
						//if click
						$(this).toggleClass("selected");
					},
					mouseover: function(){
						$(this).addClass('mouseover');
					},
					mouseout: function(){
						$(this).removeClass('mouseover');
					}
				}
			})
			.appendTo('#conteiner_id1');
		}
		myscroll.updateScroll(conteiner);
		myscroll.updateScroll(conteiner);
	};

	

	function next() {

		var styleDir = 'citeproc-js-simple/styles'
        var style  = 'ieee.csl';
		var preferredLocale = 'ru-RU';

		var cite = new Citeproc(preferredLocale, styleDir, style, citations, load_style, locales, function (citeproc) {
		
			citeproc.updateItems(Object.keys(citations));
			console.log('citeproc',citeproc);			
			var bibliography = citeproc.makeBibliography();
			// var citate = citeproc.getCitationLabel(citations['Item-1']);
			var result = citeproc.makeCitationCluster([citations['Item-1'],citations['Item-2'],citations['Item-3'],citations['Item-4']]);
			console.log('result',result);			
			// console.log('citate',citate);
			console.log('bibliography',bibliography);
			
        });
	};

	
	
	function checkInternetExplorer(){
		var rv = -1;
		if (window.navigator.appName == 'Microsoft Internet Explorer') {
			const ua = window.navigator.userAgent;
			const re = new RegExp('MSIE ([0-9]{1,}[\.0-9]{0,})');
			if (re.exec(ua) != null) {
				rv = parseFloat(RegExp.$1);
			}
		} else if (window.navigator.appName == 'Netscape') {
			const ua = window.navigator.userAgent;
			const re = new RegExp('Trident/.*rv:([0-9]{1,}[\.0-9]{0,})');

			if (re.exec(ua) != null) {
				rv = parseFloat(RegExp.$1);
			}
		}
		return rv !== -1;
	};

	function cancelEvent(e){
		if (e && e.preventDefault) {
			e.stopPropagation(); // DOM style (return false doesn't always work in FF)
			e.preventDefault();
		}
		else {
			window.event.cancelBubble = true;//IE stopPropagation
		}
	};

	window.Asc.plugin.button = function(id)
	{
		if(id==0)
		{
			alert(this.text)
		}
		if((id==-1) || (id==1))
		{
			this.executeCommand("close", "");
		}
	};

})(window, undefined);