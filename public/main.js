const form = document.getElementById('vote-form');
var event;

form.addEventListener('submit', e=>{
    
    const choice = document.querySelector('input[name=jurusan]:checked').value;
    const data = {jurusan: choice};

    fetch('http://localhost:3000/poll',{
        method: 'post',
        body: JSON.stringify(data),
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    }).then(res => res.json())
    .catch(err => console.log(err));

    e.preventDefault();
});

fetch("http://localhost:3000/poll")
    .then(res => res.json())
    .then(data => {
        let votes = data.votes;
        let totalVotes = votes.length;
        document.querySelector('#chartTitle').textContent = `Total Votes: ${totalVotes}`;

        let voteCounts = {
            Tpl: 0,
            Informatika: 0,
            Jaringan: 0,
            Multimedia: 0
        };

        voteCounts = votes.reduce((acc, vote) => (
            (acc[vote.jurusan] = (acc[vote.jurusan] || 0) + parseInt(vote.points)), acc),
            {}
        );

        let dataPoints = [
            { label: 'tpl', y: voteCounts.tpl },
            { label: 'informatika', y: voteCounts.informatika },
            { label: 'jaringan', y: voteCounts.jaringan },
            { label: 'multimedia', y: voteCounts.multimedia }
        ];
            
        const chartContainer = document.querySelector('#chartContainer');
        
        if(chartContainer){

            // Listen for the event.
            document.addEventListener('votesAdded', function (e) { 
                document.querySelector('#chartTitle').textContent = `Total Votes: ${e.detail.totalVotes}`;
            });
            
            const chart = new CanvasJS.Chart('chartContainer', {
                animationEnabled: true,
                theme: 'theme1',
                data:[
                    {
                        type: 'column',
                        dataPoints: dataPoints
                    }
                ]
            });
            chart.render();
        
             // Enable pusher logging - don't include this in production
             Pusher.logToConsole = true;
        
            var pusher = new Pusher('7ab4fe85edce28436af7', {
               cluster: 'ap1',
               encrypted: true
             });
         
             var channel = pusher.subscribe('os-poll');

             channel.bind('os-vote', function(data) {
               dataPoints.forEach((point)=>{
                   if(point.label == data.jurusan)
                   {
                        point.y+=data.points;
                        totalVotes+=data.points;
                        event = new CustomEvent('votesAdded',{detail:{totalVotes:totalVotes}});
                        // Dispatch the event.
                        document.dispatchEvent(event);
                   }
               });
               chart.render();
             });
        }

});
