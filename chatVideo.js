import {pushSocketIdToArray,emitNotifyToArray,removeSocketIdFromArray} from "./../../helpers/socketHelper";

let chatVideo = (io) => {
    let clients = {};
    io.on("connection", (socket) => {
        clients = pushSocketIdToArray(clients,socket.request.user._id,socket.id);
      //sử lý phần group
        socket.request.user.chatGroupIds.forEach(group => {
          //đưa socketid vào group_id
          clients = pushSocketIdToArray(clients, group._id, socket.id);
        });

        //phần ta cần sử lý 
        
        /**
         * server lắng nghe thông điệp caller-check-listener-online 
         * từ người gọi , với data là dữ liệu client gửi lên
         */

        socket.on("caller-check-listener-online", (data) => {
            /**
             * tiến hành kiểm tra với listenerId chính là cái khóa
             * chứa uid người chát ..nếu tồn tại tức online
             */
            if (clients[data.listenerId]) {
              let response = {
                callerId: socket.request.user._id,
                listenerId: data.listenerId,
                callerName: data.callerName
              };
              /**
               * trả về cho client..tham số thứ nhất là biến client
               * tham số thứ 2 key : data.listenerId chúng ta sẽ gửi về 
               * cho đối tượng đang lắng nghe
               * tham số thứ 3 : io
               * tham số thứ 4 : thông điệp server trả về,
               * tham số thứ 5 : dữ liệu server trả về
               * do server đang lắng nghe từ người gọi gọi người nghe
               * nên trả về cho người nghe
               */
              emitNotifyToArray(clients, data.listenerId, io, "caller-request-peer-id-of-listener", response);
            } else {
                /**
                 * trường hợp người dùng không online server sẽ gửi 
                 * về cho người gọi 1 thông điệp
                 */
              socket.emit("server-send-listener-is-offline");
            }
          });


          /**
         * server lắng nghe -sử lý với peerid gửi từ client với 
         * thông điệp listener-emit-peer-id-to-server kèm data 
         * chứa thông tin peerid của người lắng nghe user 02
         */

        socket.on("listener-emit-peer-id-to-server", (data) => {
            let response = {
              callerId: data.callerId,
              listenerId: data.listenerId,
              callerName: data.callerName,
              listenerName: data.listenerName,
              listenerPeerId: data.listenerPeerId
            };
           
            /**
             * server sẽ sử lý và gửi về thông điêp 
             * server-send-peer-id-of-listener-to-caller 
             * cho người gọi tức usero1
             */
            if (clients[data.callerId]) {
              emitNotifyToArray(clients, data.callerId, io, "server-send-peer-id-of-listener-to-caller", response);
            }
        });


        /**
         * lắng nghe thông điệp caller-request-call-to-server từ người gọi 
         * server sử lý
         */
        socket.on("caller-request-call-to-server", (data) => {
          let response = {
            callerId: data.callerId,
            listenerId: data.listenerId,
            callerName: data.callerName,
            listenerName: data.listenerName,
            listenerPeerId: data.listenerPeerId
          };
          /**
           * trả về cho người nhận thông điệp 
           * server-send-request-call-to-listener
           */
          if (clients[data.listenerId]) {
            emitNotifyToArray(clients, data.listenerId, io, "server-send-request-call-to-listener", response);
          }
        });


        /**
         * lắng nghe thông điệp caller-cancel-request-call-to-server 
         * từ người gọi yêu cầu server hủy cuộc gọi
         */
        socket.on("caller-cancel-request-call-to-server", (data) => {
          let response = {
            callerId: data.callerId,
            listenerId: data.listenerId,
            callerName: data.callerName,
            listenerName: data.listenerName,
            listenerPeerId: data.listenerPeerId
          };
          /**
           * server gửi thông điệp server-send-cancel-request-call-to-listener
           * đến cho người nhận
           */
          if (clients[data.listenerId]) {
            emitNotifyToArray(clients, data.listenerId, io, "server-send-cancel-request-call-to-listener", response);
          }
        });


        /**
         * lắng nghe thông điệp listener-reject-request-call-to-server 
         * từ người nhận yêu cầu server từ chối cuộc gọi
         */

        socket.on("listener-reject-request-call-to-server", (data) => {
          let response = {
            callerId: data.callerId,
            listenerId: data.listenerId,
            callerName: data.callerName,
            listenerName: data.listenerName,
            listenerPeerId: data.listenerPeerId
          };
          /**
           * server lắng nghe trả về cho người gọi thông điệp
           */
          if (clients[data.callerId]) {
            emitNotifyToArray(clients, data.callerId, io, "server-send-reject-call-to-caller", response);
          }
        });



        /**
         * lắng nghe thông điệp listener-accept-request-call-to-server 
         * từ người nhận xác nhận đồng ý cuộc gọi
         */

        socket.on("listener-accept-request-call-to-server", (data) => {
          let response = {
            callerId: data.callerId,
            listenerId: data.listenerId,
            callerName: data.callerName,
            listenerName: data.listenerName,
            listenerPeerId: data.listenerPeerId
          };
          /**
           * nếu người gọi sẵn sàng ...k bị sự cố ngoài ý muốn vd tắt máy ...thì
           * server sẽ gửi thông điệp : erver-send-accept-call-to-caller cho
           * người gọi
           */
          if (clients[data.callerId]) {
            emitNotifyToArray(clients, data.callerId, io, "server-send-accept-call-to-caller", response);
          }
           /**
           * nếu người nhận sẵn sàng ...k bị sự cố ngoài ý muốn vd tắt máy ...thì
           * server sẽ gửi thông điệp : server-send-accept-call-to-listener cho
           * người nhận
           */
          if (clients[data.listenerId]) {
            emitNotifyToArray(clients, data.listenerId, io, "server-send-accept-call-to-listener", response);
          }
        });





        //kết thúc sử lý
        
        socket.on("disconnect", () => {
            clients = removeSocketIdFromArray(clients, socket.request.user._id, socket);
          //sử lý cho group
            socket.request.user.chatGroupIds.forEach(group => {
              clients = removeSocketIdFromArray(clients, group._id, socket);
            });
          });         
    });
};
module.exports = chatVideo;
