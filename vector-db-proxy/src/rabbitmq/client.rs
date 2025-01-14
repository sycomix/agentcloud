use crate::rabbitmq::models::RabbitConnect;
use amqp_serde::types::{FieldTable, FieldValue, ShortStr};
use amqprs::channel::{Channel, ExchangeDeclareArguments};
use amqprs::{
    callbacks::{DefaultChannelCallback, DefaultConnectionCallback},
    channel::{BasicQosArguments, QueueBindArguments, QueueDeclareArguments},
    connection::{Connection, OpenConnectionArguments},
};
use tokio::time::{sleep, Duration};

pub async fn connect_rabbitmq(connection_details: &RabbitConnect) -> Connection {
    let mut res = Connection::open(
        &OpenConnectionArguments::new(
            &connection_details.host,
            connection_details.port,
            &connection_details.username,
            &connection_details.password,
        )
        .virtual_host("/"),
    )
    .await;

    while res.is_err() {
        println!("trying to connect after error");
        sleep(Duration::from_millis(2000)).await;
        res = Connection::open(&OpenConnectionArguments::new(
            &connection_details.host,
            connection_details.port,
            &connection_details.username,
            &connection_details.password,
        ))
        .await;
    }

    let connection = res.unwrap();
    connection
        .register_callback(DefaultConnectionCallback)
        .await
        .unwrap();
    connection
}

pub async fn channel_rabbitmq(connection: &Connection) -> Channel {
    let channel = connection.open_channel(None).await.unwrap();
    channel
        .register_callback(DefaultChannelCallback)
        .await
        .unwrap();
    return channel;
}

pub async fn bind_queue_to_exchange(
    connection: &mut Connection,
    channel: &mut Channel,
    connection_details: &RabbitConnect,
    exchange: &str,
    queue: &str,
    routing_key: &str,
) {
    if !connection.is_open() {
        println!("Connection not open");
        *connection = connect_rabbitmq(connection_details).await;
        *channel = channel_rabbitmq(&connection).await;
        println!("{}", connection);
    }
    // Declaring the exchange on startup
    channel
        .exchange_declare(ExchangeDeclareArguments::new(exchange, "direct"))
        .await
        .unwrap();
    // Setting up basic quality-of-service parameters for the channel to enable streaming queue
    channel
        .basic_qos(BasicQosArguments {
            prefetch_count: 1,
            prefetch_size: 0,
            global: false,
        })
        .await
        .unwrap();
    // adding queue type as custom arguments to the queue declaration
    let mut args: FieldTable = FieldTable::new();
    let queue_type_x: ShortStr = "x-queue-type".try_into().unwrap();
    let queue_type_q: FieldValue = "stream".try_into().unwrap();
    args.insert(queue_type_x, queue_type_q);

    let (queue, _, _) = channel
        .queue_declare(
            QueueDeclareArguments::default()
                .queue(queue.to_owned())
                .auto_delete(false)
                .durable(true)
                .arguments(args)
                .finish(),
        )
        .await
        .unwrap()
        .unwrap();

    //check if the channel is open, if not then open it
    if !channel.is_open() {
        println!(
            "Channel is not open, does exchange {} exist on rabbitMQ?",
            exchange
        );
        *channel = channel_rabbitmq(&connection).await;
    }

    // bind the queue to the exchange using this channel
    channel
        .queue_bind(QueueBindArguments::new(&queue, exchange, routing_key))
        .await
        .unwrap();
}
