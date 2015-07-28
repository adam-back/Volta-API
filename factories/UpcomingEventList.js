var ScheduledEvent = function(hour, minutes, turnOn, kin){
  var scheduledEvent = {};
  scheduledEvent.kin = kin;
  scheduledEvent.turnOn = turnOn;
  scheduledEvent.hour = hour;
  scheduledEvent.minutes = minutes;
  return scheduledEvent;
};

//Custom Data Structure
//Ordered list of events, arranged by time ASC
var UpcomingEventsList = function(scheduledEventArray){
  var list = {};
  list.head = null;
  list.tail = null;
  list.length = 0;

  var nodesByPosition = {};
  var nodesByKin = {};
  var positionByNode = {};

  if(scheduledEventArray) {
    list.addBulkAndSort(scheduledEventArray);
  }

  list.addToTail = function(scheduledEvent){
    var node = new makeNode(scheduledEvent);

    if(list.tail === null){
      console.log('no tail, add to both head and tail')
      list.head = node;
      list.tail = node;
    }else{
      console.log('has tail, append to tail')
      list.tail.next = node;
      node.previous = list.tail;
      list.tail = node;
    }

    if(!nodesByKin[scheduledEvent.kin]) {
      nodesByKin[scheduledEvent.kin] = {};
    }
    console.log('turnOn or Off: ', scheduledEvent.turnOn);
    var turnOnOff = scheduledEvent.turnOn ? 'turnOn' : 'turnOff';
    nodesByKin[scheduledEvent.kin][turnOnOff] = node;

    nodesByPosition[list.length] = node;
    positionByNode[node] = list.length;
    list.length++
  };

  list.addToHead = function(scheduledEvent){
    var node = new makeNode(scheduledEvent);
    if(list.head){
      list.head.previous = node;
      node.next = list.head;
      list.head = node;
    } else {
      list.head = node;
      list.tail = node;
    }

    for(var i=list.length-1; i>=0; i--) {
      nodesByPosition[i+1] = nodesByPosition[i];
    }

    if(!nodesByKin[scheduledEvent.kin]) {
      nodesByKin[scheduledEvent.kin] = {};
    }
    var turnOnOff = scheduledEvent.turnOn ? 'turnOn' : 'turnOff';
    nodesByKin[scheduledEvent.kin][turnOnOff] = node;

    positionByNode[node] = 0;
    nodesByPosition[0] = node;
    list.length++
  };

  list.removeHead = function(){
    var temp = list.head;
    console.log('head to be removed: ', temp);

    if(!list.head.next) {
      console.log('head has no next value');
      list.head = null;
    } else {
      list.head = list.head.next;
      list.head.previous = null;
    }

    if(!list.head) {
      list.tail = null;
    }

    for(var i=1; i<list.length; i++) {
      nodesByPosition[i-1] = nodesByPosition[i];
      positionByNode[nodesByPosition[i]] -= 1;
    }
    delete nodesByPosition[list.length-1];
    delete positionByNode[temp];
    list.length--;

    var scheduledEvent = temp.scheduledEvent;
    console.log('remove head! ', scheduledEvent, ' type: ', typeof scheduledEvent.turnOn);
    var turnOnOff = scheduledEvent.turnOn ? 'turnOn' : 'turnOff';
    delete nodesByKin[scheduledEvent.kin][turnOnOff];


    console.log('Head - Object? ', nodesByKin[scheduledEvent.kin]);
    if(nodesByKin[scheduledEvent.kin] && Object.keys(nodesByKin[scheduledEvent.kin]).length === 0) {
      delete nodesByKin[scheduledEvent.kin];
    }

    return temp.scheduledEvent;
  };

  list.removeTail = function(){
    var tail = list.tail;
    list.tail = list.tail.previous;
    list.tail.next = null;

    delete nodesByPosition[list.length-1];
    delete positionByNode[tail];
    list.length--;

    var scheduledEvent = tail.scheduledEvent;
    var turnOnOff = scheduledEvent.turnOn ? 'turnOn' : 'turnOff';
    delete nodesByKin[scheduledEvent.kin][turnOnOff];
    console.log('Tail - Object? ', nodesByKin[scheduledEvent]);
    if(nodesByKin[scheduledEvent.kin] && Object.keys(nodesByKin[scheduledEvent.kin]).length === 0) {
      delete nodesByKin[scheduledEvent.kin];
    }

    return tail.scheduledEvent;
  };

  // list.contains = function(scheduledEvent){
  //   var currentNode = list.head;
  //   while(currentNode){
  //     if(currentNode.scheduledEvent === target){
  //       return currentNode;
  //     }else{
  //       currentNode = currentNode.next;
  //     }
  //   }
  //   return false;
  // };

  //keeps list in order
  list.insert = function(scheduledEvent) {
    console.log('list insert: ', scheduledEvent)
    var newNode = new makeNode(scheduledEvent);
    //find where the time fits in the list
    //loop over nodes
    //if time is less than node.time, continue
    //if time is more than node.time, insert at current position-1
    //i.e. 
      //newNode.next = node;
      //node.previous.next = newNode;

    console.log('insert into list');
    var currentNode = list.head;

    if(!currentNode) {
      console.log('add to tail - insert')
      list.addToTail(scheduledEvent);
      return true;
    }

    while(currentNode) {
      console.log('insert while loop');

      if(!nodesByKin[scheduledEvent.kin]) {
        nodesByKin[scheduledEvent.kin] = {};
      }

      //WTF was I thinking?
      // nodesByKin[scheduledEvent].push(newNode);
      var turnOnOff = scheduledEvent.turnOn ? 'turnOn' : 'turnOff';
      nodesByKin[scheduledEvent.kin][turnOnOff] = newNode;

      //if the event to be inserted occurs before this event
      //insert the new event before the current event
      if(compareScheduledEventsTimes(scheduledEvent, currentNode.scheduledEvent) === -1) {
        console.log('append node to list');
        console.log('current: ', currentNode.scheduledEvent);
        console.log('new node: ', newNode.scheduledEvent);

        //adjust: 
        // √ nodesByPosition
        // √ nodesByKin
        // √ positionByNode
        var currentNodePosition = positionByNode[currentNode];
        nodesByPosition[currentNodePosition] = newNode;
        positionByNode[newNode] = currentNodePosition;

        for(var i=list.length-1; i>currentNodePosition; i--) {
          positionByNode[nodesByPosition[i]] += 1;
          nodesByPosition[i+1] = nodesByPosition[i];
        }
        
        list.length++;
        newNode.next = currentNode;
        newNode.previous = currentNode.previous;

        if(!currentNode.previous) {
          console.log('set as head')
          list.head = newNode;
        } else {
          console.log('add to middle of list?')
          currentNode.previous.next = newNode;
        }

        if(!currentNode.next) {
          console.log('set as tail')
          list.tail = currentNode;
        }
        currentNode.previous = newNode;

        return true;
      } else {
        currentNode = currentNode.next;
      }
    }
    list.addToTail(scheduledEvent);
    return true;

    //can be modified to work with binary search using nodesByPosition
  };

  list.removeAllOfKin = function(kin) {
    console.log('removing kin ', kin);
    var nodesToRemove = nodesByKin[kin];
    
    console.log('nodesToRemove: ', nodesToRemove);
    //{
    //  turnOn: {node}
    //  turnOff: {node}
    //}

    for(var key in nodesToRemove) {
      console.log('removing one of kin ', kin);
      var node = nodesToRemove[key];
      if(!node.previous) {
        console.log('remove head by kin');
        list.removeHead();
      } else if(!node.next) {
        console.log('remove tail by kin')
        list.removeTail();
      } else {
        var beforeNode = node.previous;
        console.log('before node: ', beforeNode);
        beforeNode.next = node.next;
        list.length--;
      }
    }
    delete nodesByKin[kin];

    console.log('removed kin ', kin);
  };

  list.addBulkAndSort = function(scheduledEventArray) {
    // sort the array
    // create a node for each event
    // and add it to the list

    //faster adding, if there are no nodes in list, via pre-sorting
    if(list.length === 0) {
      scheduledEventArray.sort(compareScheduledEventsTimes);

      console.log('sorted bulk: ', scheduledEventArray);
      for(var i=0; i<scheduledEventArray.length; i++) {
        // var node = new makeNode(scheduledEventArray[i]);
        list.addToTail(scheduledEventArray[i]);
      }

    } else {
      for(var i=0; i<scheduledEventArray.length; i++) {
        list.insert(scheduledEventArray[i]);
      }
    }
  };

  list.containsEventOfKin = function(kin) {
    console.log(nodesByKin);
    return nodesByKin[kin] ? true : false;
  };

  return list;
};

var compareScheduledEventsTimes = function(a,b) {
  if(a.hour > b.hour) {
    return 1;
  } else if(a.hour < b.hour) {
    return -1;
  } else {
    if(a.minutes > b.minutes) {
      return 1;
    } else if(a.minutes < b.minutes) {
      return -1;
    } else {
      return 0;
    }
  }
};

var makeNode = function(scheduledEvent){
  var node = {};

  node.scheduledEvent = scheduledEvent;
  node.next = null;
  node.previous = null;

  return node;
};

module.exports = exports = {
  ScheduledEvent: ScheduledEvent,
  UpcomingEventsList: UpcomingEventsList
};