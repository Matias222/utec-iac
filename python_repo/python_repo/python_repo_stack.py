from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_iam as iam,
    CfnOutput  
)
from constructs import Construct


class PythonRepoStack(Stack):

    def __init__(self, scope: Construct, id: str, **kwargs) -> None:

        super().__init__(scope, id, **kwargs)

        vpc = ec2.Vpc(self, "MyVpc", max_azs=2) 

        security_group = ec2.SecurityGroup(
            self, "MySecurityGroup",
            vpc=vpc,
            description="Allow all traffic from anywhere",
            allow_all_outbound=True 
        )

        security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.all_traffic(),
            "Allow all traffic from anywhere"
        )

        role = iam.Role(
            self, "EC2Role",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore") 
            ]
        )

        ubuntu_ami = ec2.MachineImage.lookup(
            name="ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*",  
            owners=["099720109477"] 
        )

        user_data = ec2.UserData.for_linux()

        user_data.add_commands(
            'cd home/ubuntu',
            'sudo snap install docker',
            'git clone https://github.com/Matias222/utec-cloud-semana4.git',
            'cd utec-cloud-semana4/compose',
            'sleep 60',
            'sudo docker compose up -d'
        )

        ec2_instance = ec2.Instance(
            self, "utecc_cloud_proyecto_1_python",
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
            machine_image=ubuntu_ami, 
            vpc=vpc,
            role=role,
            security_group=security_group,
            key_name="utec_ec2",
            vpc_subnets={
                "subnet_type": ec2.SubnetType.PUBLIC 
            },
            user_data=user_data,
        )

        CfnOutput(self, "InstancePublicIp", value=ec2_instance.instance_public_ip)
