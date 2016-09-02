// Traduction
translation = {
	"" : {"fr" : ""},
	"Edit the content of the page" : {"fr" : "Modifier le contenu de la page"},
	"Add a page" : {"fr" : "Ajouter une page"},
	"Thank you to select a template" : {"fr" : "Merci de s\u00e9lectionner un model de page"},
	"Back to Top" : {"fr" : "Retour en haut"},
	"Error" : {"fr" : "Erreur"},
	"Validate the connection in the popup" : {"fr" : "Valider la connexion dans la fen\u00eatre"},
	"State" : {"fr" : "Etat"},
	"Active" : {"fr" : "Actif"},
	"Deactivate" : {"fr" : "D\u00e9sactiv\u00e9"},
	"Visitors do not see this content" : {"fr" : "Les visiteurs ne voient pas ce contenu"}
}

// Fonction d'ajout d'une liste de traduction
add_translation = function(new_translation) {
	$.each(new_translation, function(i, val) { 
		translation[i] = val; 
		translation[i.toLowerCase()] = val;// Lowercase les index de traduction
	});
}

// Ajoute la traduction courante
add_translation(translation);


// Obtenir le contenu d'un cookie
get_cookie = function(key) {
	var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
	return keyValue ? keyValue[2] : '';
}

// Cr�e un cookie
set_cookie = function(key, val, days) {
	var expire = new Date();
	expire.setTime(expire.getTime() + (days*24*60*60*1000));
	document.cookie = key + "="+ val +"; expires="+ expire.toGMTString() +"; path=/";
}


// Traduit un texte
__ = function(txt) {
	if(translation[txt][get_cookie('lang')]) return translation[txt][get_cookie('lang')];	
	else return txt;
}


//@todo: A finir : init en display none, animation qui vien du haut en fade, au click dessus on ferme, croix pour fermer
// Affichage d'un message d'erreur
error = function(txt){		
	alert(txt);
	//$(body).html("<div class='ui-state-error ui-corner-all'><p><span class='ui-icon ui-icon-alert'></span>" + txt + "</p></div>");
}

// Affichage d'un message positif
light = function(txt){		
	alert(txt);
	//$(body).html("<div class='ui-state-highlight ui-corner-all'><p><span class='ui-icon ui-icon-info'></span>" + txt + "</p></div>");
}


// Liste des fonctions d'�dition des plugin
edit = [];


// Formulaire d'ajout d'une page
add_page = function()
{	
	$.ajax({url: "api/ajax.admin.php?mode=add-page&callback=add_page"})
		.done(function(html) {	
			// Contenu de la dialog d'ajout
			$("body").append(html);		
			
			// Cr�ation de la dialog
			$(".dialog-add").dialog({
				modal: true,
				width: "80%",
				buttons: {
					"OK": function() {
						if(!$(".dialog-add #tpl").val()) error(__("Thank you to select a template"));
						else {
							$.ajax({
								type: "POST",
								url: "api/ajax.admin.php?mode=insert",
								data: {
									"title": $(".dialog-add #title").val(),
									"tpl": $(".dialog-add #tpl").val(),
									"permalink": $(".dialog-add #permalink").val(),
									"nonce": $("#nonce").val()// Pour la signature du formulaire
								}
							})
							.done(function(html) {		
								$(".dialog-add").dialog("close");
								$("body").append(html);
							});
						}
					}
				},
				close: function() {
					$(".dialog-add").remove();					
				}
			});
		});
}


// Cr�e le permalink � partir du titre de la page
refresh_permalink = function(target) {
	// Animation de chargement
	$(target+" #refresh-permalink i").addClass("fa-spin");

	// R�cup�re l'url encod�e
	$.ajax({
		type: "POST",
		url: "api/ajax.admin.php?mode=make-permalink",
		data: {"title": $(target+" #title").val(), "nonce": $("#nonce").val()},
		success: function(url){ 
			$(target+" #refresh-permalink i").removeClass("fa-spin");
			$(target+" #permalink").val(url);

			$(target+" #homepage").prop("checked", false);// On uncheck l'option homepage
			
			if($("#admin-bar").length) tosave();// A sauvegarder
		}
	});
}


// Fermeture de la dialog de connexion
close_dialog_connect = function() 
{	
	if($("#dialog-connect").length) $("#dialog-connect").fadeOut().dialog("close");
}

// Recharge la page et lance le mode �dition
reload = function() {	
	edit_launcher("reload");
}

// Lance le mode �dition
edit_launcher = function(callback) 
{	
	close_dialog_connect();

	// Si le mode �dition n'est pas d�j� lanc�
	if(!$("#admin-bar").length) 
	{
		$.ajax({url: "api/ajax.admin.php?mode=edit"+(callback?"&callback="+callback:""), cache: false})
		.done(function(html) {				
			$("body").append(html);
		});
	}
};


$(document).ready(function()
{
	hover_add = false;

	// Bouton ajout de page/article
	$("body").prepend("<a href='javascript:void(0);' class='bt fixed add' title='"+ __("Add a page") +"'><i class='fa fa-fw fa-plus bigger vam'></i></a>");
	
	// Bouton d'�dition si la page existe dans la base
	if(typeof state !== 'undefined' && state) $("body").prepend("<a href='javascript:void(0);' class='bt fixed edit' title='"+ __("Edit the content of the page") +"'><i class='fa fa-fw fa-pencil bigger vam'></i></a>");

	// Bouton pour remonter en haut au scroll
	$("body").prepend("<a href='javascript:void(0);' class='bt fixed top' title='"+ __("Back to Top") +"'><i class='fa fa-fw fa-chevron-up bigger vam'></i></a>");
	
	// Page d�sactiv� => message admin
	if(typeof state !== 'undefined' && state && state != "active" && get_cookie("auth").indexOf("edit_content")) {
		$("body").append("<a href='javascript:void(0);' class='bt fixed construction bold' title=\""+ __("Visitors do not see this content") +"\"><i class='fa fa-fw fa-user-secret bigger vam'></i>"+ __("State") +" : "+ __(state) +"</a>");
		$(".bt.fixed.construction").click(function(){ $(this).slideUp(); });
	}

	// Smoothscroll to top
	$("a.bt.fixed.top").click(function() {
		$("html, body").animate({scrollTop: 0}, 300);
		return false;
	});

	// Bind le bouton d'�dition
	$("a.bt.edit").click(function() 
	{
		// Si la page n'est pas activ�e  et que l'on n'est pas admin on callback un reload
		edit_launcher(((state != "active" && !get_cookie("auth").indexOf("edit_content")) ? "reload":"edit_launcher"));

		$("a.bt.fixed.edit").fadeOut();
		$("a.bt.fixed.add").fadeOut();
	});	

	// Bind le bouton d'�dition
	$("a.bt.add").click(function() 
	{
		add_page();
	});	


	// Affichage du bouton add
	$("a.bt.fixed.edit").hover(
		function() {
			$("a.bt.fixed.add").css("right", parseInt($("a.bt.fixed.edit").css("right")) + "px");// m�me niveau right
			$("a.bt.fixed.add").fadeIn();//fadeIn
			$("a.bt.fixed.add").css("bottom", parseInt($("a.bt.fixed.edit").css("bottom")) + $("a.bt.fixed.edit").outerHeight() + "px");// au dessus bt edit
			hover_add = true;
		},
		function() {
			hover_add = false;
			setTimeout(function() { if(!hover_add) $("a.bt.fixed.add").fadeOut("fast");	}, 1000);
	});
	
	// Onhover bouton add on le conserve visible
	$("a.bt.fixed.add").hover(
		function() { hover_add = true; },
		function() {
			hover_add = false;
			setTimeout(function() { if(!hover_add) $("a.bt.fixed.add").fadeOut("fast");	}, 1000);
	});


	// Si on a une scrollbar
	if ($("body").height() > $(window).height()) 
	{        
		// Au scroll on affiche ou pas les boutons flottants
		$(window).scroll(function() 
		{
			// Affichage du bouton scroll to top
			if($(window).scrollTop() > 50) $("a.bt.fixed.top").show();
			else
			{
				$("a.bt.fixed.top").fadeOut("fast", function(){
					$("a.bt.fixed.edit").css("right","20px");
				});
			}

			// Si la barre d'administration n'est pas ouverte et la dialog de connexion inexistante
			if(!$("#admin-bar").length && !$("#dialog-connect").length)
			{
				// Affichage du bouton d'�dition  avec 50px de marge OU si on est admin
				if(($(document).height() - 50) <= ($(window).height() + $(window).scrollTop()) || get_cookie("auth").indexOf("edit_content")) 
				{	
					// D�cale l'icone si il y a le bt to top
					if($("a.bt.fixed.top").css("display") != "none") $("a.bt.fixed.edit").css("right","70px");
					
					// Affichage du bouton d'�dition
					$("a.bt.fixed.edit").fadeIn("slow");				
				}
				else if($("a.bt.fixed.edit").css("display") == "block")
					$("a.bt.fixed.edit").fadeOut();
			}
		});
    }
	else if(!$("#admin-bar").length && !$("#dialog-connect").length)// On affiche au bout de x seconde le bouton d'�dition
	{
		if(typeof state !== 'undefined')
			if(state) $("a.bt.fixed.edit").delay("2500").fadeIn("slow");
			else $("a.bt.fixed.add").delay("2500").fadeIn("slow");	
	}
	
	// Si on appuie sur la touche haut ou bas on ouvre le bouton d'�dition
	if(get_cookie("auth").indexOf("edit_content") && !$("#admin-bar").length && !$("#dialog-connect").length)
	{
		// Si on appuie sur la touche haut ou bas on ouvre le bouton d'�dition
		$(document).keyup(function(event) {			
			if((event.which == 38 || event.which == 40) && !$("#admin-bar").length) $("a.bt.fixed.edit").fadeIn();			
		});
	}
	
});	