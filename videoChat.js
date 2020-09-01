function videoChat(divId) {
  //lắng nghe sự kiện
  $(`#video-chat-${divId}`).unbind("click").on("click", function() {
    //khởi tạo biến targetid
    let targetId = $(this).data("chat");
    /**
     * lấy ra tên người gọi...ta có thể tham khảo file
     * src\views\main\navbar\navbar.ejs để dễ hiểu
     */
    let callerName = $(`#navbar-username`).text();

    /**
     * tạo biến chứa thông tin gồm 2key chứa thông tin
     * listenerId : là người lắng nghe
     *  callerName : người gọi
     */
    let dataToEmit = {
      listenerId: targetId,
      callerName: callerName
    };
    /**
    * Step 01 gửi đến server thông điệp : caller-check-listener-online
    *  kèm dữ liệu là dataToEmit
    */
  socket.emit("caller-check-listener-online", dataToEmit);
    
  });
}


function playVideoStream(videoTagId, stream) {
let video = document.getElementById(videoTagId);
video.srcObject = stream;
video.onloadeddata = function () {
  video.play();
};
}

$(document).ready(function() {
  // Step 02 of caller
  socket.on("server-send-listener-is-offline", function () {
    alertify.notify("Người dùng này hiện không trực tuyến.", "error", 7);
  });
  
  let getPeerId = "";
  const peer = new Peer({
    key: "peerjs",
    host: "peerjs-server-trungquandev.herokuapp.com",
    secure: true,
    port: 443,
    debug: 3,//hiển thị tất cả thông tin ...chỉ dùng trong dev,chạy bỏ ra 
  });

  peer.on("open", function(peerId) {
    getPeerId = peerId;
  });


  // Step 03 of listener
  socket.on("caller-request-peer-id-of-listener", function(response) {
    //lấy ra tên người nghe
  let listenerName = $(`#navbar-username`).text();

      let dataToEmit = {
        callerId: response.callerId,
        listenerId: response.listenerId,
        callerName: response.callerName,
        listenerName: listenerName,
        listenerPeerId: getPeerId
      };
  // Step 04 of listener
  socket.emit("listener-emit-peer-id-to-server", dataToEmit);
  });


  let timerInterval;

  /**
   * step 5 : client lắng nghe thông điệp từ server trả về :
   * server-send-peer-id-of-listener-to-caller cụ thể là 
   * trả về cho người gọi ...kèm data quan trọng peerid 
   */
  socket.on("server-send-peer-id-of-listener-to-caller", function(response){   
    //lấy ra thông tin 
    let dataToEmit = {
    callerId: response.callerId,
    listenerId: response.listenerId,
    callerName: response.callerName,
    listenerName: response.listenerName,
    listenerPeerId: response.listenerPeerId
    };               
    /**
       * step 6 :sau khi có được thông tin cần thiết quan trọng 
       * nhất là peerid ..người gọi tức user01 sẽ gửi thông điêp
       * caller-request-call-to-server lên server ..gọi video
       */
      socket.emit("caller-request-call-to-server", dataToEmit);
      //xuất hiện thông báo gọi video màn hình người gọi

          Swal.fire({
          title: `${response.callerName} Đang gọi cho &nbsp; <span style="color: #2ECC71;">${response.listenerName}</span> &nbsp; <i class="fa fa-volume-control-phone"></i>`,
          html: `
              Thời gian: <strong style="color: #d43f3a;"></strong> giây. <br/><br/>
              <button id='btn-cancel-call' class='btn btn-danger'>
              Hủy cuộc gọi.
              </button>`,
          backdrop: "rgba(85,85,85,0.4)",
          width: "52rem",
          //để không tắt popup khi chưa chạy hết thời gian
          allowOutsideClick: false,
          timer: 30000,
          position: "top-end",
          onBeforeOpen: () => {
            //gọi sự kiện hủy cuộc gọi
            $("#btn-cancel-call").on("click", function() {
              //đóng poup
              Swal.close();
              //xóa thời gian hiển thị
              clearInterval(timerInterval);
              /**
               *  Step 07 gọi đến server 1 thông điệp
               * caller-cancel-request-call-to-server để
               *  hủy cuộc gọi ,với data gửi kèm
               */

              socket.emit("caller-cancel-request-call-to-server", dataToEmit);

            });
            //kết thúc sự kiện hủy cuộc gọi
            if(Swal.getContent().querySelector !== null){
              Swal.showLoading();
              timerInterval = setInterval(() => {
              Swal.getContent().querySelector("strong").textContent = Math.ceil(Swal.getTimerLeft() / 1000);
              }, 1000);
            }
              
          },
          onOpen: () => {
            // Step 12 of caller
            socket.on("server-send-reject-call-to-caller", function(response) {
              Swal.close();
              clearInterval(timerInterval);
              Swal.fire({
                type: "info",
                title: `<span style="color: #2ECC71;">${response.listenerName}</span> &nbsp; hiện tại không thể nghe máy. `,
                backdrop: "rgba(85,85,85,0.4)",
                width: "52rem",
                allowOutsideClick: false,
                confirmButtonColor: "#5cb85c",
                confirmButtonText: "Xác nhận"
              });
            });

          },
          onClose: () => {
              clearInterval(timerInterval);
          }
          }).then((result) => {
          return false;
          });

          //kết thúc thông báo gọi video

      });






      /**
         * Step 08 người nghe user02..lắng nghe thông điệp 
         * server-send-request-call-to-listener trả về từ server
        */ 
       socket.on("server-send-request-call-to-listener", function(response) 
       {
           let dataToEmit = {
             callerId: response.callerId,
             listenerId: response.listenerId,
             callerName: response.callerName,
             listenerName: response.listenerName,
             listenerPeerId: response.listenerPeerId
           };

           //thực hiện hành động


           Swal.fire({
             title: `<span style="color: #2ECC71;">${response.callerName}</span> &nbsp; muốn trò chuyện video với bạn &nbsp; <i class="fa fa-volume-control-phone"></i>`,
             html: `
               Thời gian: <strong style="color: #d43f3a;"></strong> giây. <br/><br/>
               <button id='btn-reject-call' class='btn btn-danger'>
                 Từ chối.
               </button>
               <button id='btn-accept-call' class='btn btn-success'>
                 Đồng ý.
               </button>`,
             backdrop: "rgba(85,85,85,0.4)",
             width: "52rem",
             //để không tắt popup khi chưa chạy hết thời gian
             allowOutsideClick: false,
             timer: 30000,
             position: "top-end",
             onBeforeOpen: () => {
               //từ chối cuộc gọi
               $("#btn-reject-call").on("click", function() {
                Swal.close();
                clearInterval(timerInterval);
      
                // Step 10 of listener
                socket.emit("listener-reject-request-call-to-server", dataToEmit);
              });
              //kết thúc từ chối cuộc gọi

              //sử lý khi bấm nút đồng ý cuộc gọi
              $("#btn-accept-call").on("click", function() {
                Swal.close();
                clearInterval(timerInterval);
      
                // Step 11 of listener
                socket.emit("listener-accept-request-call-to-server", dataToEmit);
              });
              //kết thúc sử lý khi bấm nút đồng ý cuộc gọi
              if(Swal.getContent().querySelector !== null){
                Swal.showLoading();
               timerInterval = setInterval(() => {
                 Swal.getContent().querySelector("strong").textContent = Math.ceil(Swal.getTimerLeft() / 1000);
               }, 1000);
              }
               
             },  
             onOpen: () => {
              // Step 09 of listener
              socket.on("server-send-cancel-request-call-to-listener", function(response) {
                Swal.close();
                clearInterval(timerInterval);
              });

            },            
             onClose: () => {
               clearInterval(timerInterval);
             }
           }).then((result) => {
             return false;
           });

           //ket thúc hành động

       });



// Step 13 of caller: handle accept call
socket.on("server-send-accept-call-to-caller", function(response) {
Swal.close();
clearInterval(timerInterval);
let getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia).bind(navigator);

getUserMedia({video: true, audio: true}, function(stream) {

  //thêm vào màn hình gọi
  $("#streamModal").modal("show");
  //hiển thị video trên màn hình người gọi
  playVideoStream("local-stream", stream);
  //thực hiện call cho người nghe
  let call = peer.call(response.listenerPeerId, stream);
  //đợi người nghe chấp nhận cái cuộc gọi 
  call.on('stream', function(remoteStream) {
    //chạy luồng stream hiển thị play của người nghe tại đây
    playVideoStream("remote-stream", stream);
  });
}, function(err) {
  console.log('Failed to get local stream' ,err);
});
});



// Step 14 of listener: handle accept call
socket.on("server-send-accept-call-to-listener", function(response) {
Swal.close();
clearInterval(timerInterval);
// Listener answer...
//debug thông tin nhận
console.log(response);
//ok tiến hành
let getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia).bind(navigator);

peer.on("call", function(call) {
  getUserMedia({video: true, audio: true}, function(stream) {
    console.log("lang nghe nguoi gọi nè");
    //hien thi vào màn hình nghe goi popup
  $("#streamModal").modal("show");
  //hiển thị video trên màn hình người gọi
  playVideoStream("local-stream", stream);
    call.answer(stream); // Answer the call with an A/V stream.
    call.on("stream", function(remoteStream) {
      playVideoStream("remote-stream", stream);
    });
  }, function(err) {
    console.log("Failed to get local stream" ,err);
  });
});
});




});
