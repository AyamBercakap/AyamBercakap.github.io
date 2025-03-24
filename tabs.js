function openTab(evt, TabName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName('tabcontent');
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = 'none';
  }
  tablinks = document.getElementsByClassName('tablinks');
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(' active', '');
  }
  document.getElementById(TabName).style.display = 'block';
  evt.currentTarget.className += ' active';
  
  // Trigger scramble effect on the newly active tab
  const scrambler = new TextScramble(evt.currentTarget);
  scrambler.scrambleOnActive();
}
