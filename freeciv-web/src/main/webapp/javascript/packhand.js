/********************************************************************** 
 Freeciv - Copyright (C) 2009 - Andreas Røsdal   andrearo@pvv.ntnu.no
   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation; either version 2, or (at your option)
   any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
***********************************************************************/



/* Freeciv Web Client. 
   This file contains the handling-code for packets from the civserver.
*/

function handle_processing_started(packet) 
{
  client_frozen = true;
}

function handle_processing_finished(packet) 
{
  client_frozen = false;
}

function handle_freeze_hint(packet) 
{
  client_frozen = true;
}

function handle_thaw_hint(packet) 
{
  client_frozen = false;
}

/* 100% */
function handle_ruleset_terrain(packet) 
{
  terrains[packet['id']] = packet;
}

/****************************************************************************
  After we send a join packet to the server we receive a reply.  This
  function handles the reply.  100% Complete.
****************************************************************************/
function handle_server_join_reply(packet) 
{
  if (packet['you_can_join']) {
    client.conn.established = true;
    client.conn.id = packet['conn_id'];

    if (get_client_page() == PAGE_MAIN
	|| get_client_page() == PAGE_NETWORK
	|| get_client_page() == PAGE_GGZ) {
      set_client_page(PAGE_START);
    }

    set_client_state(C_S_PREPARING);

  } else {

    alert("You were rejected from the game.");
    client.conn.id = -1;/* not in range of conn_info id */
    set_client_page(PAGE_MAIN);

  }

}

/**************************************************************************
  Remove, add, or update dummy connection struct representing some
  connection to the server, with info from packet_conn_info.
  Updates player and game connection lists.
  Calls update_players_dialog() in case info for that has changed.
  99% done.
**************************************************************************/
function handle_conn_info(packet) 
{
  var pconn = find_conn_by_id(packet['id']);


  if (packet['used'] == false) {
    /* Forget the connection */
    if (pconn == null) {
      freelog(LOG_VERBOSE, "Server removed unknown connection " + packet['id']);
      return;
    }
    client_remove_cli_conn(pconn);
    pconn = null;
  } else {
    var pplayer = valid_player_by_number(packet['player_num']);

    packet['playing'] = pplayer;
    
    if (packet['id'] == client.conn.id) {
      client.conn = packet;
    } 

    conn_list_append(packet);

  }

  if (packet['id'] == client.conn.id) {
    if (client.conn.playing != packet['playing']) {
      set_client_state(C_S_PREPARING);
    }
  }

  /* FIXME: not implemented yet.
  update_players_dialog();
  update_conn_list_dialog();*/

}

/* 100% done */
function handle_ruleset_resource(packet) 
{
  resources[packet['id']] = packet;
}

/**************************************************************************
This was once very ugly...                                   99% complete
**************************************************************************/
function handle_tile_info(packet) 
{
  var new_known;
  var old_known;
  var known_changed = false;
  var tile_changed = false;
  var powner = valid_player_by_number(packet['owner']);
  var presource = resources[packet['resource']];
  var pterrain = terrains[packet['terrain']];


  if (tiles != null) {
    var index = packet['x'] + packet['y'] * map['xsize'];
    tiles[index] = $.extend(tiles[index], packet);
  }

}

/* 100% complete */
function handle_chat_msg(packet) 
{
  var message = unescape(packet['message']);
  var conn_id = packet['conn_id'];
  var event = packet['event'];
  
  if (connections[conn_id] != null) {
    var username = connections[conn_id]['username'];
    add_chatbox_text("<b>" + username + ":</b>" + message);
  } else {
    if (packet['event'] == 45) {	  
      var regxp = /\n/gi;
      message = message.replace(regxp, "<br>\n");
      show_dialog_message("Message for you:", message);
    } else {
      add_chatbox_text(message);
    }
  }
}

/* 100% complete */
function handle_city_info(packet) 
{
  if (cities[packet['id']] == null) { 
    cities[packet['id']] = packet;
  } else {
    cities[packet['id']] = $.extend(cities[packet['id']], packet);
  } 
   
  if (active_city != null) {
    show_city_dialog(active_city);
  }

  if (packet['diplomat_investigate']) {
    show_city_dialog(cities[packet['id']]);
  }
}

/* 99% complete 
   TODO: does this loose information? */
function handle_city_short_info(packet) 
{
  if (cities[packet['id']] == null) { 
    cities[packet['id']] = packet;
  } else {
    cities[packet['id']] = $.extend(cities[packet['id']], packet);
  } 
}

/* 100% complete */
function handle_player_info(packet) 
{

  if (client != null && client.conn.playing != null 
    && packet['playerno'] == client.conn.playing['playerno'] 
    && packet['researching'] != client.conn.playing['researching']) {
    $("#tech_tab_item").css("color", "#ff0000");
  }

  players[packet['playerno']] = $.extend(players[packet['playerno']], packet);
  
  if (client.conn.playing != null) {
    if (packet['playerno'] == client.conn.playing['playerno']) {
      client.conn.playing = players[packet['playerno']];
    }
  } 
  update_player_info();

  if (is_tech_tree_init && tech_dialog_active) update_tech_screen();
}

/* 100% complete */
function handle_player_remove(packet) 
{
  delete players[packet['playerno']];
  update_player_info();

}

/* 100% complete */
function handle_conn_ping(packet) 
{
  var test_packet = {"type" : packet_conn_pong};
  var myJSONText = JSON.stringify(test_packet);
  send_request (myJSONText);

}

/* 50% complete */
function handle_map_info(packet) 
{
  map = packet;

  map_init_topology(false);

  map_allocate();

  /* TODO: init_client_goto();*/

  mapdeco_init();

  /* TODO: generate_citydlg_dimensions();*/

  /* TODO: calculate_overview_dimensions();*/

  /*packhand_init();*/

}

/* 100% complete */
function handle_game_info(packet) 
{
  game_info = packet;
}

/* 30% complete */
function handle_start_phase(packet)
{

  update_client_state(C_S_RUNNING);

  set_phase_start();

  /* TODO: implement rest*/

}

function handle_ruleset_control(packet)
{

  update_client_state(C_S_PREPARING);

  /* TODO: implement rest*/

}

function handle_endgame_report(packet)
{

  update_client_state(C_S_OVER);

  /* TODO: implement rest*/

}

function update_client_state(value)
{
  var changed = (client_state() != value);

  if (C_S_PREPARING == client_state()
      && C_S_RUNNING == value) {
    /*FIXME: popdown_races_dialog();*/
  }
  
  set_client_state(value);

  if (C_S_RUNNING == client_state()) {
    /*FIXME: refresh_overview_canvas();

    /*update_info_label();	 //get initial population right 
    update_unit_focus();
    update_unit_info_label(get_units_in_focus());

    if (auto_center_each_turn) {
      center_on_something();
    }*/
  }

  if (C_S_OVER == client_state()) {
    /*refresh_overview_canvas();

    update_info_label();
    update_unit_focus();
    update_unit_info_label(NULL); */
  }

  //if (changed) {
    /*if (can_client_change_view()) {
      update_map_canvas_visible();
    }

    // If turn was going to change, that is now aborted. 
    set_server_busy(FALSE);*/
  //}


}

function handle_authentication_req(packet) 
{
  /* Auth not supported. */
}

function handle_server_shutdown(packet) 
{
  /* TODO: implement*/
}

function handle_nuke_tile_info(packet) 
{
  /* TODO: implement*/
}

/* done */
function handle_city_remove(packet) 
{
  remove_city(packet['city_id']);
}


function handle_connect_msg(packet) 
{
  var message = packet['message'];
  add_chatbox_text(message);
}


/* done */
function handle_city_name_suggestion_info(packet) 
{
  city_name_dialog(packet['name'], packet['unit_id']);
}

function handle_city_sabotage_list(packet) 
{
  /* TODO: implement*/
}

function handle_player_attribute_chunk(packet) 
{
  /* TODO: implement*/
}

/**************************************************************************
  Handle a remove-unit packet, sent by the server to tell us any time a
  unit is no longer there.                             99% complete.
**************************************************************************/
function handle_unit_remove(packet) 
{
  var punit = game_find_unit_by_number(packet['unit_id']);
  var powner;
  
  if (punit == null) {
    return;
  }
  
  /* TODO: Close diplomat dialog if the diplomat is lost */
  /* TODO: Notify agents. */

  clear_tile_unit(punit);
  client_remove_unit(punit);
  
}

/* 100% complete */
function handle_unit_info(packet) 
{
  handle_unit_packet_common(packet);
  
}

/* 99% complete FIXME: does this loose information? */
function handle_unit_short_info(packet) 
{
  handle_unit_packet_common(packet);
}

/**************************************************************************
  Called to do basic handling for a unit_info or short_unit_info packet.

  Both owned and foreign units are handled; you may need to check unit
  owner, or if unit equals focus unit, depending on what you are doing.

  Note: Normally the server informs client about a new "activity" here.
  For owned units, the new activity can be a result of:
  - The player issued a command (a request) with the client.
  - The server side AI did something.
  - An enemy encounter caused a sentry to idle. (See "Wakeup Focus").

  Depending on what caused the change, different actions may be taken.
  Therefore, this function is a bit of a jungle, and it is advisable
  to read thoroughly before changing.

  Exception: When the client puts a unit in focus, it's status is set to
  idle immediately, before informing the server about the new status. This
  is because the server can never deny a request for idle, and should not
  be concerned about which unit the client is focusing on.
**************************************************************************/
function handle_unit_packet_common(packet_unit)
{
  var pcity;
  var punit;
  var need_update_menus = true;
  var repaint_unit = true;
  var repaint_city = true;
  var old_tile = true;
  var check_focus = true;
  var moved = true;
  var ret = true;
  
  //console.log("2. handle_unit_packet_common at: " + new Date().getTime());
  //console.log(packet_unit);
  
  punit = player_find_unit_by_id(unit_owner(packet_unit), packet_unit['id']);
  
  clear_tile_unit(punit);
  
  if (punit == null && game_find_unit_by_number(packet_unit['id'])) {
    /* This means unit has changed owner. We deal with this here
     * by simply deleting the old one and creating a new one. */
    handle_unit_remove(packet_unit['id']);
  }
 
  if (units[packet_unit['id']] == null) {
    packet_unit['anim_list'] = [];  
    units[packet_unit['id']] = packet_unit;
  } else {
    update_unit_anim_list(units[packet_unit['id']], packet_unit);
    units[packet_unit['id']] = $.extend(units[packet_unit['id']], packet_unit);
  } 
  
  update_tile_unit(units[packet_unit['id']]);
  
  
  if (current_focus.length > 0 && current_focus[0]['id'] == packet_unit['id']) {
  
    update_unit_info_label(current_focus);
    
    if (current_focus[0]['done_moving'] != packet_unit['done_moving']) {
      update_unit_focus();
    }
  }

  if ((packet_unit['caravan_trade'] || packet_unit['caravan_wonder'])
      && unit_owner(packet_unit) == client.conn.playing
      && !client_is_observer()) 
    popup_caravan_dialog(packet_unit, packet_unit['caravan_trade'], packet_unit['caravan_wonder']);

  /* TODO: update various dialogs and mapview. */
}

function handle_unit_combat_info(packet) 
{
  /* TODO: implement*/
}

function handle_unit_diplomat_answer(packet) 
{
  var diplomat_id = packet['diplomat_id'];  
  var target_id = packet['target_id'];
  var cost = packet['cost'];
  var action_type = packet['action_type'];
  
  var pcity = game_find_city_by_number(target_id);
  var punit = game_find_unit_by_number(target_id);
  var pdiplomat = game_find_unit_by_number(diplomat_id);
  
  
  switch (action_type) {
  /*case DIPLOMAT_BRIBE:
    if (punit != null) {
        //popup_bribe_dialog(punit, cost);
    }
    break;
  case DIPLOMAT_INCITE:
    if (pcity != null) {
        //popup_incite_dialog(pcity, cost);
    }
    break;*/
  case DIPLOMAT_MOVE:
      process_diplomat_arrival(pdiplomat, target_id);
    break;
  };

}

function handle_diplomacy_init_meeting(packet) 
{
  if (!(diplomacy_request_queue.indexOf(packet['counterpart']) >= 0)) {
    diplomacy_request_queue.push(packet['counterpart']);
  }
  diplomacy_clause_map[packet['counterpart']] = [];
  refresh_diplomacy_request_queue();

}

function handle_diplomacy_cancel_meeting(packet) 
{
  cancel_meeting(packet['counterpart']);
}

function handle_diplomacy_create_clause(packet) 
{
  if(diplomacy_clause_map[packet['counterpart']] == null) {
    diplomacy_clause_map[packet['counterpart']] = [];
  }
  diplomacy_clause_map[packet['counterpart']].push(packet);
  show_diplomacy_clauses();
}

function handle_diplomacy_remove_clause(packet) 
{
  remove_clause(packet);
}

function handle_diplomacy_accept_treaty(packet) 
{
  accept_treaty(packet['counterpart'], 
		packet['I_accepted'], 
		packet['other_accepted']);
}

function handle_page_msg(packet) 
{
  var message = packet['message'];
  var regxp = /\n/gi;
  message = message.replace(regxp, "<br>\n");
  show_dialog_message("Freeciv.net News", message);

}

function handle_conn_ping_info(packet) 
{
  if (debug_active) {
    conn_ping_info = packet;
    debug_ping_list.push(packet['ping_time'][0]);
  }
}

function handle_end_phase(packet) 
{
  chatbox_text = " ";

}

/* Done. */
function handle_new_year(packet) 
{
  game_info['year'] = packet['year'];
  game_info['turn'] = packet['turn']; 
}

function handle_begin_turn(packet) 
{
  update_unit_focus();
  auto_center_on_focus_unit();
  update_unit_info_label(current_focus);
  update_game_status_panel();
  if (is_tech_tree_init && tech_dialog_active) update_tech_screen();

  // FIXME: update_client_state(C_S_RUNNING);
}

function handle_end_turn(packet) 
{
  reset_unit_anim_list(); 
}

function handle_freeze_client(packet) 
{
  client_frozen = true;
}

function handle_thaw_client(packet) 
{
  client_frozen = false;
}

function handle_spaceship_info(packet) 
{
  /* TODO: implement*/
}

/* 100% complete */
function handle_ruleset_unit(packet) 
{
  unit_types[packet['id']] = packet;
}

/* 100% complete */
function handle_ruleset_game(packet) 
{
  game_rules = packet;
}

/* 100% complete */
function handle_ruleset_specialist(packet) 
{
  specialists[packet['id']] = packet;
}

function handle_ruleset_government_ruler_title(packet) 
{
  /* TODO: implement*/
}

/* 100% complete */
function handle_ruleset_tech(packet) 
{
  techs[packet['id']] = packet;
}

/* 100% complete */
function handle_ruleset_government(packet) 
{
  governments[packet['id']] = packet;
}

/* 100% complete */
function handle_ruleset_terrain_control(packet) 
{
  terrain_control = packet;
}

/* 100% complete */
function handle_ruleset_nation_groups(packet) 
{
  nation_groups = packet['groups'];
}

/* 100% complete */
function handle_ruleset_nation(packet) 
{
  nations[packet['id']] = packet;
}

function handle_ruleset_city(packet) 
{
  city_rules[packet['style_id']] = packet;
}

/* 100% complete */
function handle_ruleset_building(packet) 
{
  improvements[packet['id']] = packet;
}

function handle_ruleset_unit_class(packet) 
{
  /* TODO: implement*/
}

function handle_ruleset_base(packet) 
{
  /* TODO: implement*/
}

function handle_single_want_hack_reply(packet) 
{
  /* TODO: implement*/
}

function handle_ruleset_choices(packet) 
{
  /* TODO: implement*/
}

function handle_game_load(packet) 
{
  /* TODO: implement*/
}

function handle_options_settable_control(packet) 
{
  /* TODO: implement*/
}

function handle_options_settable(packet) 
{
  /* TODO: implement*/
}

 /* Done */
function handle_ruleset_effect(packet) 
{
  effects[packet['effect_type']] = packet;
}
 
 /* Done */
function handle_ruleset_effect_req(packet) 
{
  requirements[packet['effect_id']] = packet;
}

function handle_scenario_info(packet) 
{
  /* TODO: implement*/
}

function handle_vote_new(packet) 
{
  /* TODO: implement*/
}

function handle_vote_update(packet) 
{
  /* TODO: implement*/
}

function handle_vote_remove(packet) 
{
  /* TODO: implement*/
}

function handle_vote_resolve(packet) 
{
  /* TODO: implement*/
}

function handle_edit_object_created(packet) 
{
  /* edit not supported. */
}

function handle_goto_path(packet) 
{
  show_goto_path(packet);
  update_map_canvas_check();
}

